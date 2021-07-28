import BaseCommand from "./BaseCommand";
import RirichiyoClient from "../RirichiyoClient";
import { message_delete_timeout, owners } from "../../config";
import { BaseCTX, InteractionCTX, MessageCTX } from './CTX';
import {
    Collection,
    TextChannel,
    Message,
    CommandInteraction,
    MessageComponentInteraction
} from "discord.js";
import {
    EmbedUtils,
    PermissionUtils
} from "../Utils";

export class CommandHandler {
    client: RirichiyoClient;
    cooldowns: Collection<string, Collection<string, number>>;
    errorMessage: string;

    constructor(client: RirichiyoClient) {
        this.client = client;
        this.cooldowns = new Collection();
        this.errorMessage = `There was an error executing that command, please try again.\nIf this error persists, please report this issue on our support server- [ririchiyo.xyz/support](https://youtu.be/dQw4w9WgXcQ)`;//${Utils.config.settings.info.supportServerURL}
    }

    get defaultPrefixes() {
        return [
            `<@${this.client.user!.id}>`,
            `<@!${this.client.user!.id}>`,
            this.client.user!.id,
            this.client.user!.username.toLowerCase(),
            this.client.user!.username.split(" ")[0].toLowerCase()
        ];
    }

    checkCooldown(recievedAt: number, command: BaseCommand, userID: string, add = true): CooldownCheckResponse {
        //No cooldown for owner
        if (owners.find(u => u.id === userID)) return false;

        //If cooldowns collection does not have cooldown list for this command
        if (!this.cooldowns.has(command.name)) this.cooldowns.set(command.name, new Collection());

        const commandCooldownList = this.cooldowns.get(command.name)!;

        if (commandCooldownList.has(userID)) {
            const expirationTime = (commandCooldownList.get(userID) || 0) + command.cooldown;
            if (recievedAt < expirationTime) return { timeLeft: (expirationTime - recievedAt) };
        }

        if (add) {
            commandCooldownList.set(userID, recievedAt);
            setTimeout(() => commandCooldownList.delete(userID), command.cooldown);
        }

        return false;
    }

    async handleMessage(msg: Message, recievedAt: number, isEdit: boolean = false) {
        //Check all usable prefixes
        let usedPrefix = null;
        const prefixes = this.defaultPrefixes;
        const guildData = await this.client.db.getGuild(msg.guild);
        const guildSettings = guildData.settings.getSettings();
        //Guild or DM prefix check
        if (msg.content.startsWith(guildSettings.prefix)) usedPrefix = guildSettings.prefix;
        //If message does not start with prefix and message is in a guild, add nickname to the prefixes array to check
        else if (msg.guild) {
            const nickname = msg.guild.members.resolve(this.client.user!.id!)?.nickname;
            if (nickname) prefixes.push(nickname.toLowerCase(), nickname.split(" ")[0].toLowerCase());
        }

        //If there was no used prefix till now, check the prefixes array for any match
        if (!usedPrefix) {
            const lowerCaseContent = msg.content.trim().toLowerCase();
            usedPrefix = prefixes.sort((a, b) => b.length - a.length).find(p => lowerCaseContent.startsWith(p));
        }

        //Return if no prefix was found
        if (!usedPrefix) return;

        //Process args and command name
        const args = msg.content.slice(usedPrefix.length).trim().split(/\s+/);
        const usedCommandName = args.shift()?.toLowerCase() || 'help';

        //Find the requested command
        const command =
            //Find the command by name
            this.client.commands.get(usedCommandName)
            //Find the command by alias
            || this.client.commands.find((cmd) =>
                !!(
                    cmd.aliases &&
                    cmd.aliases.length &&
                    cmd.aliases.includes(usedCommandName)
                ));

        //Check if command exists and meets the requirements to run
        if (
            !command
            || !command.allowMessageCommand
            || (msg.guild && !command.allowGuildCommand)
            || (!msg.guild && !command.allowDMCommand)
            || (isEdit && !command.editable)
        ) return;

        //Create the ctx
        const ctx = new MessageCTX({
            recievedAt,
            args: args.length ? args : null,
            message: msg,
            botPermissionsForChannel: PermissionUtils.getPermissionsForChannel(msg.channel as TextChannel),
            isInteraction: false,
            isMessage: true,
            guildData,
            guildSettings,
            isEdit
        });

        //Check if bot has required permissions to run the command
        const permissions = await PermissionUtils.handlePermissionsForChannel(ctx.channel, {
            userToDM: msg.author,
            ctx,
            requiredPermissions: command.botPermsRequired
        });
        if (!permissions.hasAll) return;


        //Handle owner only commands
        if (command.ownerOnly && !owners.find(o => o.id === msg.author.id)) return await ctx.reply({
            embeds: [EmbedUtils.embedifyString(msg.guild, "This command can only be used by the bot owners!", { isError: true })]
        }).catch(this.client.logger.error);

        //Handle cooldown
        const cooldown = this.checkCooldown(recievedAt, command, msg.author.id);
        if (cooldown) {
            if (permissions.permissions.has('MANAGE_MESSAGES') && msg.deletable) await msg.delete().catch(this.client.logger.error);
            return await ctx.reply({
                embeds: [EmbedUtils.embedifyString(msg.guild, `Please wait ${(cooldown.timeLeft / 1000).toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`, { isError: true })]
            }, { ephemeral: true, deleteTimeout: cooldown.timeLeft - recievedAt }).catch(this.client.logger.error);
        };

        //Remove the bot mention in case the bot was mentioned as a prefix
        if (this.defaultPrefixes.slice(0, 2).includes(usedPrefix)) {
            msg.mentions.users.delete(msg.client.user!.id);
            if (msg.mentions.members) msg.mentions.members?.delete(msg.client.user!.id);
        }

        await command.run(ctx).catch(async (err) => {
            this.client.logger.error(err);
            await ctx.reply(
                permissions.permissions.has('EMBED_LINKS')
                    ? { embeds: [EmbedUtils.embedifyString(msg.guild, this.errorMessage, { isError: true })] }
                    : this.errorMessage
            ).catch(this.client.logger.error);
        }).catch(this.client.logger.error);
    }

    async handleComponentInteraction(interaction: MessageComponentInteraction, recievedAt: number) {
        //Find the requested command
        const command = this.client.commands.get(interaction.customId);

        //Check if command exists and meets the requirements to run
        if (
            !command
            || !command.allowMessageCommponentInteraction
            || (interaction.guild && !command.allowGuildCommand)
            || (!interaction.guild && !command.allowDMCommand)
        ) return;

        const guildData = await this.client.db.getGuild(interaction.guild);
        const guildSettings = guildData.settings.getSettings();

        //Create the ctx
        const ctx = new InteractionCTX({
            recievedAt,
            args: null,
            message: interaction,
            botPermissionsForChannel: PermissionUtils.getPermissionsForChannel(interaction.channel as TextChannel),
            isInteraction: true,
            isMessage: false,
            guildData,
            guildSettings,
        });

        //Check if bot has required permissions to run the command
        const permissions = await PermissionUtils.handlePermissionsForChannel(ctx.channel, {
            userToDM: interaction.user,
            ctx,
            requiredPermissions: command.botPermsRequired
        });
        if (!permissions.hasAll) return;

        //Handle owner only commands
        if (command.ownerOnly && !owners.find(o => o.id === interaction.user.id)) return await ctx.reply({
            embeds: [EmbedUtils.embedifyString(interaction.guild, "This command can only be used by the bot owners!", { isError: true })]
        }, { ephemeral: true })

        //Handle cooldown
        const cooldown = this.checkCooldown(recievedAt, command, interaction.user.id);
        if (cooldown) {
            return await ctx.reply({
                embeds: [EmbedUtils.embedifyString(interaction.guild, `Please wait ${(cooldown.timeLeft / 1000).toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`, { isError: true })]
            }, { ephemeral: true })
        };

        await command.run(ctx).catch(async (err) => {
            this.client.logger.error(err);
            await ctx.reply(
                permissions.permissions.has('EMBED_LINKS')
                    ? { embeds: [EmbedUtils.embedifyString(interaction.guild, this.errorMessage, { isError: true })] }
                    : this.errorMessage
            ).catch(this.client.logger.error);
        }).catch(this.client.logger.error);
    }
}

export type CooldownCheckResponse = false | { timeLeft: number };

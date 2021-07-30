import BaseCommand from "./BaseCommand";
import RirichiyoClient from "../RirichiyoClient";
import { owners } from "../../config";
import CTX from './CTX';
import { Collection, TextChannel, CommandInteraction, MessageComponentInteraction } from "discord.js";
import { EmbedUtils, PermissionUtils } from "../Utils";

export class CommandHandler {
    client: RirichiyoClient;
    cooldowns: Collection<string, Collection<string, number>>;
    errorMessage: string;

    constructor(client: RirichiyoClient) {
        this.client = client;
        this.cooldowns = new Collection();
        this.errorMessage = `There was an error executing that command, please try again.\nIf this error persists, please report this issue on our support server- [ririchiyo.xyz/support](https://youtu.be/dQw4w9WgXcQ)`;//${Utils.config.settings.info.supportServerURL}
    }

    checkCooldown(recievedAt: number, command: BaseCommand<boolean>, userID: string, add = true): CooldownCheckResponse | null {
        //No cooldown for owner
        if (owners.find(u => u.id === userID)) return null;

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

        return null;
    }

    async handleCommandInteraction(interaction: CommandInteraction, recievedAt: number) {
        //Find the requested command
        const command = this.client.commands.get(interaction.commandName);

        //Check if command exists and meets the requirements to run
        if (!command || (interaction.guild && !command.allowGuildCommand) || (!interaction.guild && !command.allowDMCommand)) return;

        const guildData = await this.client.db.getGuild(interaction.guild);
        const guildSettings = guildData.settings.getSettings();

        //Create the ctx
        const ctx = new CTX({
            recievedAt,
            interaction,
            command,
            guildData,
            guildSettings,
            botPermissionsForChannel: PermissionUtils.getPermissionsForChannel(interaction.channel as TextChannel)
        });

        //Check if bot has required permissions to run the command
        const permissions = await PermissionUtils.handlePermissionsForChannel(ctx.channel as TextChannel, {
            userToDM: interaction.user,
            ctx,
            channelPermissions: ctx.botPermissionsForChannel,
            guildPermsRequired: command.serverPermsRequired,
            channelPermsRequired: command.channelPermsRequired,
            webhookPermsRequired: command.webhookPermsRequired
        });
        if (!permissions.hasAll) return;


        //Handle owner only commands
        if (command.ownerOnly && !owners.find(o => o.id === interaction.user.id)) return await ctx.reply({
            embeds: [EmbedUtils.embedifyString(interaction.guild, "This command can only be used by the bot owners!", { isError: true })]
        }).catch(this.client.logger.error);

        //Handle cooldown
        const cooldown = this.checkCooldown(recievedAt, command, interaction.user.id);
        if (cooldown) {
            return await ctx.reply({
                embeds: [EmbedUtils.embedifyString(interaction.guild, `Please wait ${(cooldown.timeLeft / 1000).toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`, { isError: true })]
            }, { ephemeral: true, deleteTimeout: cooldown.timeLeft - recievedAt }).catch(this.client.logger.error);
        };

        await command.run(ctx).catch(async (err) => {
            this.client.logger.error(err);
            await ctx.reply({ embeds: [EmbedUtils.embedifyString(interaction.guild, this.errorMessage, { isError: true })] }).catch(this.client.logger.error);
        })
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
        const ctx = new CTX<boolean, true>({
            recievedAt,
            interaction,
            command,
            guildData,
            guildSettings,
            botPermissionsForChannel: PermissionUtils.getPermissionsForChannel(interaction.channel as TextChannel)
        });

        //Check if bot has required permissions to run the command
        const permissions = await PermissionUtils.handlePermissionsForChannel(ctx.channel as TextChannel, {
            userToDM: interaction.user,
            ctx,
            channelPermissions: ctx.botPermissionsForChannel,
            guildPermsRequired: command.serverPermsRequired,
            channelPermsRequired: command.channelPermsRequired,
            webhookPermsRequired: command.webhookPermsRequired
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
            await ctx.reply({ embeds: [EmbedUtils.embedifyString(interaction.guild, this.errorMessage, { isError: true })] }).catch(this.client.logger.error);
        })
    }
}

export type CooldownCheckResponse = { timeLeft: number };

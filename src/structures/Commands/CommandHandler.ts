import BaseCommand from "./BaseCommand";
import RirichiyoClient from "../RirichiyoClient";
import { owners } from "../../config";
import CTX from './CTX';
import { Collection, TextChannel, CommandInteraction, MessageComponentInteraction } from "discord.js";
import Utils, { EmbedUtils, PermissionUtils } from "../Utils";

export class CommandHandler {
    client: RirichiyoClient;
    cooldowns: Collection<string, Collection<string, number>>;

    constructor(client: RirichiyoClient) {
        this.client = client;
        this.cooldowns = new Collection();
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
        const userData = await this.client.db.getUser(interaction.user);
        const guildSettings = guildData.settings.getSettings();
        const lang = guildSettings.languagePreference;

        //Create the ctx
        const ctx = new CTX({
            recievedAt,
            interaction,
            command,
            guildData,
            userData,
            guildSettings,
            botPermissionsForChannel: PermissionUtils.getPermissionsForChannel(interaction.channel as TextChannel),
            language: lang
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
            embeds: [
                EmbedUtils.embedifyString(interaction.guild, ctx.language.COMMAND_OWNER_ONLY, { isError: true })
            ]
        }).catch(this.client.logger.error);

        //Handle cooldown
        const cooldown = this.checkCooldown(recievedAt, command, interaction.user.id);
        if (cooldown) {
            return await ctx.reply({
                embeds: [
                    EmbedUtils.embedifyString(interaction.guild, Utils.formatString(
                        ctx.language.COMMAND_RATELIMITED,
                        (cooldown.timeLeft / 1000).toFixed(1),
                        command.name), { isError: true })
                ], ephemeral: true
            }).catch(this.client.logger.error);
        };

        await command.run(ctx).catch(async (err) => {
            this.client.logger.error(err);
            await ctx.reply({
                embeds: [
                    EmbedUtils.embedifyString(interaction.guild, ctx.language.COMMAND_ERROR, { isError: true })
                ]
            }).catch(this.client.logger.error);
        })
    }

    async handleComponentInteraction(interaction: MessageComponentInteraction, recievedAt: number) {
        const commandInfo = Utils.decodeButtonID(interaction.customId);
        if (!commandInfo) return;

        const command = this.client.commands.get(commandInfo.commandName);

        //Check if command exists and meets the requirements to run
        if (
            !command
            || !command.allowMessageCommponentInteraction
            || (interaction.guild && !command.allowGuildCommand)
            || (!interaction.guild && !command.allowDMCommand)
        ) return;

        const guildData = await this.client.db.getGuild(interaction.guild);
        const userData = await this.client.db.getUser(interaction.user);
        const guildSettings = guildData.settings.getSettings();
        const lang = guildSettings.languagePreference;

        //Create the ctx
        const ctx = new CTX<boolean, true>({
            recievedAt,
            interaction,
            command,
            guildData,
            userData,
            guildSettings,
            botPermissionsForChannel: PermissionUtils.getPermissionsForChannel(interaction.channel as TextChannel),
            language: lang
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
            embeds: [
                EmbedUtils.embedifyString(interaction.guild, ctx.language.COMMAND_OWNER_ONLY, { isError: true })
            ], ephemeral: true
        })

        //Handle cooldown
        const cooldown = this.checkCooldown(recievedAt, command, interaction.user.id);
        if (cooldown) {
            return await ctx.reply({
                embeds: [
                    EmbedUtils.embedifyString(interaction.guild, Utils.formatString(
                        ctx.language.COMMAND_RATELIMITED,
                        (cooldown.timeLeft / 1000).toFixed(1),
                        command.name), { isError: true })
                ], ephemeral: true
            }).catch(this.client.logger.error)
        };

        await command.run(ctx, commandInfo.args).catch(async (err) => {
            this.client.logger.error(err);
            await ctx.reply({
                embeds: [
                    EmbedUtils.embedifyString(interaction.guild, ctx.language.COMMAND_ERROR, { isError: true })
                ]
            }).catch(this.client.logger.error);
        })
    }
}

export type CooldownCheckResponse = { timeLeft: number };

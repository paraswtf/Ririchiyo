import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX';
import { MusicUtil, Error, Success, FLAG } from '../../structures/Utils/MusicUtil';
import { ApplicationCommandData, MessageEmbed, TextChannel } from 'discord.js';
import { CustomEmojiUtils, EmbedUtils, ThemeUtils } from '../../structures/Utils';

export default class SummonCommand extends BaseCommand {
    constructor() {
        super({
            name: "summon",
            aliases: ["j", "join"],
            category: "music",
            description: "Make the bot join your voice channel",
            allowSlashCommand: true,
            allowMessageCommand: true,
            allowGuildCommand: true,
            allowDMCommand: false,
        })
    }

    async run(ctx: GuildCTX, opts?: Success | Error): Promise<Success | Error> {
        const res = await this.testConditions(ctx, opts);
        if (res.isError) return res;


        const { channel: meVoiceChannel } = ctx.guild.me?.voice || {};
        let dispatcher = this.client.dispatchers.get(ctx.guild.id);

        if (dispatcher && !meVoiceChannel) {
            //If this wasn't an internal call, send message
            if (!opts) {
                const reconnectedEmbed = new MessageEmbed()
                    .setDescription(`**Reconnecting to ${`<#${res.authorVoiceChannel?.id}>` || "your voice channel"}**`)
                    .setColor(ThemeUtils.colors.get("loading")!.rgbNumber())
                await ctx.reply({ embeds: [reconnectedEmbed] });
            }
            //Reconnect
            await dispatcher.attemptReconnect(res.authorVoiceChannel!.id).then(
                //If connected
                () => {
                    ctx.editResponse({
                        embeds: [
                            new MessageEmbed()
                                .setDescription(`**Reconnected to ${`<#${res.authorVoiceChannel?.id}>` || "your voice channel"}**`)
                                .setColor(ThemeUtils.getClientColor(ctx.guild))
                        ]
                    })
                },
                //If could not connect
                (error) => {
                    this.client.logger.error(error);
                    ctx.editResponse({
                        embeds: [
                            new MessageEmbed()
                                .setDescription(
                                    `**Failed while reconnecting to ${`<#${res.authorVoiceChannel?.id}>` || "your voice channel"}**${typeof error?.message === "string"
                                        ? `\n\`Error: ${error.message}\``
                                        : ""}`
                                ).setColor(ThemeUtils.colors.get('error')!.rgbNumber())
                        ]
                    })
                });

            return new Success(FLAG.RESPAWNED);
        }

        dispatcher = await this.client.dispatchers.create({
            guild: ctx.guild,
            guildData: ctx.guildData,
            guildSettings: ctx.guildSettings,
            voiceChannelID: res.authorVoiceChannel!.id,
            textChannel: ctx.channel as TextChannel,
            loopState: ctx.guildSettings.music.loopState,
            filterOptions: ctx.guildSettings.music.filters.grouped
        });

        //Send embed
        if (!opts) {
            const joinedEmbed = new MessageEmbed()
                .setDescription(`**Joined ${`<#${res.authorVoiceChannel?.id}>` || "your voice channel"}**`)
                .setColor(ThemeUtils.getClientColor(ctx.guild))
            await ctx.reply({ embeds: [joinedEmbed] });
        }

        return new Success(FLAG.NULL, undefined, res.authorVoiceChannel, dispatcher);
    }

    async testConditions(ctx: GuildCTX, prevRes?: Success | Error): Promise<Success | Error> {
        const res = prevRes || MusicUtil.canPerformAction({
            guild: ctx.guild,
            member: ctx.member,
            ctx,
            isSpawnAttempt: true,
            noDispatcherRequired: true,
            requiredPermissions: ["SUMMON_PLAYER"],
            memberPermissions: ctx.guildSettings.permissions.members.getFor(ctx.member).calculatePermissions(),
        });
        if (res.isError) return res;

        const authorVCperms = res.authorVoiceChannel?.permissionsFor(res.authorVoiceChannel.client.user!);

        if (!authorVCperms || !authorVCperms.has("VIEW_CHANNEL")) {
            await ctx.reply({ embeds: [EmbedUtils.embedifyString(ctx.guild, `${CustomEmojiUtils.get("VOICE_CHANNEL_LOCKED_RED")} I don't have permissions to view your channel!`, { isError: true })] });
            return new Error(FLAG.NO_BOT_PERMS_VIEW_CHANNEL);
        }
        if (!authorVCperms || !authorVCperms.has("CONNECT")) {
            await ctx.reply({ embeds: [EmbedUtils.embedifyString(ctx.guild, `${CustomEmojiUtils.get("VOICE_CHANNEL_LOCKED_RED")} I don't have permissions to join your channel!`, { isError: true })] });
            return new Error(FLAG.NO_BOT_PERMS_CONNECT);
        }
        if (!authorVCperms || !authorVCperms.has("SPEAK")) {
            await ctx.reply({ embeds: [EmbedUtils.embedifyString(ctx.guild, `${CustomEmojiUtils.get("VOICE_CHANNEL_LOCKED_RED")} I don't have permissions to speak in your channel!`, { isError: true })] });
            return new Error(FLAG.NO_BOT_PERMS_SPEAK);
        }

        return new Success(FLAG.NULL, undefined, res.authorVoiceChannel);
    }

    get slashCommandData(): ApplicationCommandData {
        return {
            name: this.name,
            description: this.description
        }
    }
}

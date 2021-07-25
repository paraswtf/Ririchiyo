import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX';
import { MusicUtil, Error, Success, FLAG } from '../../structures/Utils/MusicUtil';
import { MessageEmbed } from 'discord.js';
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
                    .setColor(ThemeUtils.getClientColor(ctx.guild))
                await ctx.reply({ embeds: [reconnectedEmbed] }).catch(this.client.logger.error);
            }
            //Reconnect
            await dispatcher.attemptReconnect(res.authorVoiceChannel!.id);

            return new Success(FLAG.RESPAWNED);
        }

        dispatcher = await this.client.dispatchers.create({
            guildID: ctx.guild.id,
            voiceChannelID: res.authorVoiceChannel!.id,
            loopState: ctx.guildSettings.music.loopState,
            filterOptions: ctx.guildSettings.music.filters.grouped
        });

        //Send embed
        if (!opts) {
            const joinedEmbed = new MessageEmbed()
                .setDescription(`**Joined ${`<#${res.authorVoiceChannel?.id}>` || "your voice channel"}**`)
                .setColor(ThemeUtils.getClientColor(ctx.guild))
            await ctx.reply({ embeds: [joinedEmbed] }).catch(this.client.logger.error);
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
            await ctx.reply({ embeds: [EmbedUtils.embedifyString(ctx.guild, `${CustomEmojiUtils.get("voice_channel_icon_error_locked")} I don't have permissions to view your channel!`, { isError: true })] });
            return new Error(FLAG.NO_BOT_PERMS_VIEW_CHANNEL);
        }
        if (!authorVCperms || !authorVCperms.has("CONNECT")) {
            await ctx.reply({ embeds: [EmbedUtils.embedifyString(ctx.guild, `${CustomEmojiUtils.get("voice_channel_icon_error_locked")} I don't have permissions to join your channel!`, { isError: true })] });
            return new Error(FLAG.NO_BOT_PERMS_CONNECT);
        }
        if (!authorVCperms || !authorVCperms.has("SPEAK")) {
            await ctx.reply({ embeds: [EmbedUtils.embedifyString(ctx.guild, `${CustomEmojiUtils.get("voice_channel_icon_normal_locked")} I don't have permissions to speak in your channel!`, { isError: true })] });
            return new Error(FLAG.NO_BOT_PERMS_SPEAK);
        }

        return new Success(FLAG.NULL, undefined, res.authorVoiceChannel);
    }
}

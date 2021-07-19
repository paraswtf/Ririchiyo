import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX';
import { MusicUtil, Error, Success, FLAG } from '../../structures/Utils/MusicUtil';
import InternalPermissions from '../../structures/Utils/InternalPermissions';
import { Guild, MessageEmbed } from 'discord.js';
import { CustomEmojiUtils } from '../../structures/Utils';

export default class SummonCommand extends BaseCommand {
    constructor() {
        super({
            name: "summon",
            aliases: ["j", "join"],
            category: "music",
            description: "Make the bot join your voice channel.",
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
        let player = this.client.shoukaku.players.get(ctx.guild.id);

        if (player && !meVoiceChannel) {
            if (!opts) {
                const reconnectedEmbed = new MessageEmbed()
                    .setDescription(`**Reconnected to your voice channel!**`)
                    .addField("Player Voice Channel", `${CustomEmojiUtils.get("voice_channel_icon_normal")} ${`<#${res.authorVoiceChannel?.id}>` || "unknown"}`)
                    .addField("Player Text Channel", `<#${ctx.channel.id}>`)
                    .addField("Volume", `${player.filters.volume}%`, true)
                    .addField("Loop", `${player.loopState}`, true)
                    .addField("Volume limit", `${ctx.guildSettings?.music.volume.limit}`, true)
                    .setColor(this.utils.getClientColour(ctx.guild))
                await ctx.channel.send(reconnectedEmbed).catch((err: Error) => this.globalCTX.logger?.error(err.message));;
            }
            player.connect();
            return new Success(FLAG.RESPAWNED);
        }

        player = this.globalCTX.lavalinkClient.create({
            guild: ctx.guild,
            voiceChannel: res.authorVoiceChannel!,
            textChannel: ctx.channel,
            inactivityTimeout: 300000,
            guildData: ctx.guildData,
            guildSettings: ctx.guildSettings,
            selfDeafen: true,
            serverDeaf: true,
            logger: this.globalCTX.logger,
            volume: ctx.guildSettings.music.volume.percentage > ctx.guildSettings.music.volume.limit ? ctx.guildSettings.music.volume.limit : ctx.guildSettings.music.volume.percentage,
            maxErrorsPer10Seconds: 3
        })

        //apply guild settings to player
        switch (ctx.guildSettings.music.loop) {
            case "QUEUE": player?.setQueueRepeat(true);
                break;
            case "TRACK": player?.setTrackRepeat(true);
                break;
            default:
                break;
        }

        player.setFilters(ctx.guildSettings.music.filters);

        //connect to the channel
        player.connect();

        if (!opts) {
            const joinedEmbed = new this.utils.discord.MessageEmbed()
                .setDescription(`**Joined your voice channel!**`)
                .addField("Player Voice Channel", `${await this.utils.getEmoji("voice_channel_icon_normal")} ${res.authorVoiceChannel?.name || "Unknown"}`)
                .addField("Player Text Channel", `<#${ctx.channel.id}>`)
                .addField("Volume", `${player?.volume}`, true)
                .addField("Loop", `${player?.loopState}`, true)
                .addField("Volume limit", `${ctx.guildSettings?.music.volume.limit}`, true)
                .setColor(this.utils.getClientColour(ctx.guild))
            await ctx.channel.send(joinedEmbed).catch((err: Error) => this.globalCTX.logger?.error(err.message));;
        }


        return new Success(FLAG.NULL, undefined, res.authorVoiceChannel, player);
    }

    async testConditions(ctx: GuildCTX, prevRes?: Success | Error): Promise<Success | Error> {
        const res = prevRes || MusicUtil.canPerformAction({
            guild: ctx.guild,
            member: ctx.member,
            ctx,
            isSpawnAttempt: true,
            noDispatcherRequired: true,
            requiredPermissions: ["SUMMON_PLAYER"],
            memberPermissions: ctx.guildSettings.permissions.users.getFor(ctx.member.id).calculatePermissions(ctx.member) || new InternalPermissions(0),
        });
        if (res.isError) return res;

        const authorVCperms = res.authorVoiceChannel?.permissionsFor(res.authorVoiceChannel!.client.user!);

        if (!authorVCperms || !authorVCperms.has("VIEW_CHANNEL")) {
            await ctx.channel.send(this.utils.embedifyString(ctx.guild, `${await this.utils.getEmoji("voice_channel_icon_error_locked")} I don't have permissions to view your channel!`, true));
            return new CustomError(FLAG.NO_BOT_PERMS_VIEW_CHANNEL);
        }
        if (!authorVCperms || !authorVCperms.has("CONNECT")) {
            await ctx.channel.send(this.utils.embedifyString(ctx.guild, `${await this.utils.getEmoji("voice_channel_icon_error_locked")} I don't have permissions to join your channel!`, true));
            return new CustomError(FLAG.NO_BOT_PERMS_CONNECT);
        }
        if (!authorVCperms || !authorVCperms.has("SPEAK")) {
            await ctx.channel.send(this.utils.embedifyString(ctx.guild, `${await this.utils.getEmoji("voice_channel_icon_normal_locked")} I don't have permissions to speak in your channel!`, true));
            return new CustomError(FLAG.NO_BOT_PERMS_SPEAK);
        }

        return new Success(FLAG.NULL, undefined, res.authorVoiceChannel);
    }
}

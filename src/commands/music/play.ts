import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX';
import { MusicUtil, Error, Success, FLAG } from '../../structures/Utils/MusicUtil';
import { Util as DCUtil, MessageEmbed } from 'discord.js';
import { CustomEmojiUtils, EmbedUtils, ThemeUtils } from '../../structures/Utils';
import { InternalPermissionResolvable } from '../../structures/Utils/InternalPermissions';

export default class PlayCommand extends BaseCommand {
    constructor() {
        super({
            name: "play",
            aliases: ["p"],
            category: "music",
            description: "Play a song using link or query",
            allowSlashCommand: true,
            allowMessageCommand: true,
            allowGuildCommand: true,
            allowDMCommand: false,
        })
    }

    async run(ctx: GuildCTX, top = false) {
        let dispatcher = this.client.dispatchers.get(ctx.guild.id);

        //Handle resume and pause with same command as play track
        if (!ctx.args) {
            if (dispatcher?.player.paused) return this.client.commands.get('resume')!.run(ctx);
            else if (dispatcher?.queue.current) return this.client.commands.get('pause')!.run(ctx);
            else return await ctx.reply({
                embeds: [EmbedUtils.embedifyString(ctx.guild, `${ctx.member} Please provide a song title or link to search for!`, { isError: true })]
            });
        }

        //Check permissions
        const dispatcherExists = Boolean(dispatcher && ctx.guild.me?.voice);
        let requiredPermissions: InternalPermissionResolvable[] = ["ADD_TO_QUEUE"];
        if (!dispatcherExists) requiredPermissions.push("SUMMON_PLAYER");
        if (top) requiredPermissions.push("MANAGE_QUEUE");

        let res = MusicUtil.canPerformAction({
            guild: ctx.guild,
            member: ctx.member,
            ctx,
            noDispatcherRequired: !dispatcherExists,
            isSpawnAttempt: !dispatcherExists,
            requiredPermissions,
            memberPermissions: ctx.guildSettings.permissions.members.getFor(ctx.member).calculatePermissions()
        });
        if (res.isError) return;

        //If no player summon one
        if (!dispatcherExists) {
            res = await this.client.commands.get("summon")!.run(ctx, res) as Success | Error;
            if (res.isError) return res;
        }

        dispatcher = res.dispatcher || this.client.dispatchers.get(ctx.guild.id);
        if (!dispatcher) return res;

        const searchRes = await dispatcher.search(ctx.args.join(" "), ctx.member);

        if (!searchRes) {
            return await ctx.reply({ embeds: [EmbedUtils.embedifyString(ctx.guild, "Could not find any tracks matching your query!", { isError: true })] });
        }

        const wasPlaying = dispatcher.queue.current;

        dispatcher.queue.add(searchRes.tracks, top ? dispatcher.queue.currentIndex + 1 : undefined);

        //If this is not the first song added to the queue and there was a current song then only send the added message else send the playing message in the start event
        if (dispatcher.queue.length > 1 && dispatcher.queue.current) {
            const queuedEmbed = new MessageEmbed().setColor(ThemeUtils.getClientColor(ctx.guild));

            switch (searchRes.type) {
                case "PLAYLIST":
                    queuedEmbed.setDescription(`**[${searchRes.playlistName ? DCUtil.escapeMarkdown(searchRes.playlistName) : "Unknown Playlist"}](${/*searchRes.playlist?.uri*/0}) \n(${searchRes.tracks.length} Tracks)**\n\`Added playlist to the queue ${top ? "top " : ""}by - \`${searchRes.tracks[0].requester}\` \``);
                    await ctx.reply({ embeds: [queuedEmbed] });
                    if (dispatcher.textChannel && ctx.channel.id !== dispatcher.textChannel.id) dispatcher.sendMessage({ embeds: [queuedEmbed] });
                    break;
                default:
                    queuedEmbed.setDescription(`**[${DCUtil.escapeMarkdown(searchRes.tracks[0].displayTitle)}](${searchRes.tracks[0].displayURL})**\n\`Added track to the queue ${top ? "top " : ""}by - \`${searchRes.tracks[0].requester}\` \``);
                    await ctx.reply({ embeds: [queuedEmbed] });
                    if (dispatcher.textChannel && ctx.channel.id !== dispatcher.textChannel.id) dispatcher.sendMessage({ embeds: [queuedEmbed] });
                    break;
            }
        } else dispatcher.firstCtx = ctx;

        if (!wasPlaying && !dispatcher.player.paused) await dispatcher.play();
    }
}

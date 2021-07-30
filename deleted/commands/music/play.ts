import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX';
import { MusicUtil, Error, Success } from '../../structures/Utils/MusicUtil';
import { Util as DCUtil, MessageEmbed, CommandInteraction, ApplicationCommandData } from 'discord.js';
import { EmbedUtils, ThemeUtils } from '../../structures/Utils';
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
            allowDMCommand: false
        })
    }

    async run(ctx: GuildCTX<CommandInteraction>, top = false) {
        //Defer in case of interaction
        await ctx.defer();
        //Parse the query if any
        let query: string | undefined;
        if (ctx.isInteraction) query = ctx.message.options.get("query")?.value as string;
        else query = ctx.args?.join(" ");

        let dispatcher = this.client.dispatchers.get(ctx.guild.id);

        //Handle resume and pause with same command as play track
        if (!query) {
            if (!ctx.isInteraction && dispatcher?.player.paused) return this.client.commands.get('resume')!.run(ctx);
            else if (!ctx.isInteraction && dispatcher?.queue.current) return this.client.commands.get('pause')!.run(ctx);
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

        const searchRes = await dispatcher.search(ctx.args?.join(" ") || (ctx.message as CommandInteraction).options.get("query")?.value as string, ctx.member);

        if (!searchRes) {
            return await ctx.reply({ embeds: [EmbedUtils.embedifyString(ctx.guild, "Could not find any tracks matching your query!", { isError: true })] });
        }

        const wasPlaying = dispatcher.queue.current;

        dispatcher.queue.add(searchRes.tracks, top ? dispatcher.queue.currentIndex + 1 : undefined);

        //Send the queued message
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

        if (!wasPlaying && !dispatcher.player.paused) await dispatcher.play();
    }

    get slashCommandData(): ApplicationCommandData {
        return {
            name: this.name,
            description: this.description,
            options: [
                {
                    name: "query",
                    description: "The song link or name to search for",
                    type: "STRING",
                    required: true
                }
            ]
        }
    }
}

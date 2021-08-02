import {
    EmbedUtils,
    ThemeUtils
} from '../../structures/Utils';
import {
    MessageEmbed,
    Permissions,
    ApplicationCommandData
} from 'discord.js';
import {
    MusicUtil,
    Error,
    Success
} from '../../structures/Utils/MusicUtil';
import { GuildCTX } from '../../structures/Commands/CTX';
import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { InternalPermissionResolvable } from '../../structures/Utils/InternalPermissions';

export default class PlayCommand extends BaseCommand<true, false> {
    constructor() {
        super({
            name: "play",
            category: "music",
            description: "Play a song using link or query",
            allowGuildCommand: true,
            allowDMCommand: false,
            webhookPermsRequired: new Permissions(["USE_EXTERNAL_EMOJIS"]),
            channelPermsRequired: new Permissions(['SEND_MESSAGES', 'EMBED_LINKS', 'USE_EXTERNAL_EMOJIS'])
        })
    }

    async run(ctx: GuildCTX<false>, top = false) {
        //Defer coz search takes time
        await ctx.defer();

        //Parse the query if any
        const query = ctx.interaction.options.get("query")?.value as string | undefined;
        if (!query) return;

        let dispatcher = this.client.dispatchers.get(ctx.guild.id);

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

        //Search first then join
        const searchRes = await this.client.searchResolver.search({ query, requester: ctx.member });
        if (!searchRes) {
            return await ctx.reply({ embeds: [EmbedUtils.embedifyString(ctx.guild, "Could not find any tracks matching your query!", { isError: true })] });
        }

        //If no player summon one
        if (!dispatcherExists) {
            res = await this.client.commands.get("summon")!.run(ctx, res) as Success | Error;
            if (res.isError) return res;
        }

        dispatcher = res.dispatcher || this.client.dispatchers.get(ctx.guild.id);
        if (!dispatcher) return res;

        const wasPlaying = dispatcher.queue.current;

        dispatcher.queue.add(searchRes.tracks, top ? dispatcher.queue.currentIndex + 1 : undefined);
        dispatcher.queue.recommendations = [];

        //Send the queued message
        const queuedEmbed = new MessageEmbed().setColor(ThemeUtils.getClientColor(ctx.guild));
        switch (searchRes.type) {
            case "PLAYLIST":
                queuedEmbed.setDescription(`**[${searchRes.playlistName ?? "Unknown Playlist"}](${/*searchRes.playlist?.uri*/0}) \n(${searchRes.tracks.length} Tracks)**\n\`Added playlist to the queue ${top ? "top " : ""}by - \`${searchRes.tracks[0].requester}\` \``);
                await ctx.reply({ embeds: [queuedEmbed] });
                if (dispatcher.textChannel && ctx.channel.id !== dispatcher.textChannel.id) dispatcher.sendMessage({ embeds: [queuedEmbed] });
                break;
            default:
                queuedEmbed.setDescription(`**[${searchRes.tracks[0].displayTitle}](${searchRes.tracks[0].displayURL})**\n\`Added track to the queue ${top ? "top " : ""}by - \`${searchRes.tracks[0].requester}\` \``);
                await ctx.reply({ embeds: [queuedEmbed] });
                if (dispatcher.textChannel && ctx.channel.id !== dispatcher.textChannel.id) dispatcher.sendMessage({ embeds: [queuedEmbed] });
                break;
        }

        if (!wasPlaying && !dispatcher.player.paused) await dispatcher.play();
    }

    slashCommandData: ApplicationCommandData = {
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

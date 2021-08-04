import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX';
import { MusicUtil } from '../../structures/Utils/MusicUtil';
import { CustomEmojiUtils, EmbedUtils, ThemeUtils } from '../../structures/Utils';
import { ApplicationCommandData, MessageEmbed, Permissions } from 'discord.js';
import { ResolvedTrack } from '../../structures/Shoukaku/RirichiyoTrack';
import { filledBar } from 'string-progressbar';

export default class NowPlayingCommand extends BaseCommand<true, true> {
    constructor() {
        super({
            name: "nowplaying",
            category: "music",
            description: "View the currently playing track",
            allowGuildCommand: true,
            allowDMCommand: false,
            webhookPermsRequired: new Permissions(["USE_EXTERNAL_EMOJIS"])
        })
    }

    async run(ctx: GuildCTX<true>) {
        const res = MusicUtil.canPerformAction({
            guild: ctx.guild,
            member: ctx.member,
            ctx,
            requiredPermissions: [],
            memberPermissions: ctx.guildSettings.permissions.members.getFor(ctx.member).calculatePermissions()
        });
        if (res.isError) return;

        if (!res.dispatcher?.queue.current) return await ctx.reply({
            embeds: [EmbedUtils.embedifyString(ctx.guild, "There is nothing playing right now!", { isError: true })],
            ephemeral: true
        });

        const track = res.dispatcher.queue.current as ResolvedTrack;

        const options = {
            embeds: [
                new MessageEmbed({
                    title: `${CustomEmojiUtils.get("MUSICAL_NOTES")} Now playing! ${CustomEmojiUtils.get("ANIMATED_PLAYING")}`,
                    description: `**[${track.displayTitle}](${track.displayURL})**\n` + (track.requester ? `\`Added by - \`${track.requester}\` \`` : `\`Recommended based on previous tracks\``),
                    image: {
                        url: "https://cdn.discordapp.com/attachments/756541902202863740/780739509704327198/1920x1_TP.png"
                    },
                    thumbnail: {
                        url: track.displayThumbnail("mqdefault")
                    },
                    footer: {
                        text: getProgressBar(res.dispatcher.position, track.displayDuration, track.isLive)
                    },
                    color: ThemeUtils.getClientColor(ctx.guild)
                })
            ]
        };

        return await ctx.reply(options);
    }

    slashCommandData: ApplicationCommandData = {
        name: this.name,
        description: this.description
    }
}

function getProgressBar(position: number, duration: number, isLive: boolean = false) {
    return new Date(position).toISOString().substr(11, 8) +
        "[" +
        filledBar(duration == 0 ? position : duration, position, 40, "-", "=")[0] +
        "]" +
        (isLive ? " ◉ LIVE" : new Date(duration).toISOString().substr(11, 8))
}

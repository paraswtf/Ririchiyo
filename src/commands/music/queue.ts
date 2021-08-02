import { BaseCommand } from '../../structures/Commands/BaseCommand';
import CTX, { GuildCTX } from '../../structures/Commands/CTX';
import { CustomEmojiUtils, ThemeUtils } from '../../structures/Utils';
import { ApplicationCommandData, Guild, MessageButton, MessageEmbed } from 'discord.js';
import Dispatcher from '../../structures/Shoukaku/Dispatcher';
const tracksPerPage = 25;

export default class QueueCommand extends BaseCommand<true, true> {
    constructor() {
        super({
            name: "queue",
            category: "music",
            description: "View the player queue",
            allowGuildCommand: true,
            allowDMCommand: false,
            allowMessageCommponentInteraction: true
        })
    }

    async run(ctx: GuildCTX<true>, args: string[]) {
        const dispatcher = this.client.dispatchers.get(ctx.guild.id);

        if (ctx.interaction.isButton()) return await ctx.interaction.update(getResponse(ctx.guild, { dispatcher, page: args[0] ? parseInt(args[0]) : undefined, autoPlay: ctx.guildSettings.music.autoPlay }));
        else await ctx.interaction.reply(getResponse(ctx.guild, { dispatcher, autoPlay: ctx.guildSettings.music.autoPlay }));
    }

    slashCommandData: ApplicationCommandData = {
        name: this.name,
        description: this.description
    }
}

export function getResponse(guild: Guild, { dispatcher, page, autoPlay }: GetResponseOptions) {
    const maxPageIndex = getPageCount(dispatcher?.queue.length ?? 1) - 1;
    const pageNumber = page ?? getPageNumber(dispatcher?.queue.currentIndex ?? 0);

    const pageEmbed = new MessageEmbed({
        title: `${CustomEmojiUtils.get("MUSICAL_NOTES")} Player queue ${CustomEmojiUtils.get("QUEUE_LIST")}`,
        description: dispatcher?.queue.length ? getPageContent(dispatcher, pageNumber) : "**Queue Empty**",
        color: ThemeUtils.getClientColor(guild),
        image: {
            url: "https://cdn.discordapp.com/attachments/756541902202863740/780739509704327198/1920x1_TP.png"
        },
        footer: {
            text: pageNumber === maxPageIndex
                ? (autoPlay ? "Will automatically add more songs as you listen..." : "Queue End")
                : undefined
        }
    })

    return {
        embeds: [pageEmbed],
        components: [
            {
                type: 1,
                components: [
                    new MessageButton().setCustomId(`queue:${Math.min(maxPageIndex, Math.max(0, pageNumber - 1))}`).setStyle("SECONDARY").setEmoji(CustomEmojiUtils.get("ARROW_LEFT_BUTTON").identifier),
                    new MessageButton().setCustomId(`queue:${Math.min(maxPageIndex, Math.max(0, pageNumber))}`).setStyle("SECONDARY").setEmoji(CustomEmojiUtils.get("RELOAD_BUTTON").identifier),
                    new MessageButton().setCustomId(`queue:${Math.min(maxPageIndex, Math.max(0, pageNumber + 1))}`).setStyle("SECONDARY").setEmoji(CustomEmojiUtils.get("ARROW_RIGHT_BUTTON").identifier)
                ]
            }
        ]
    }
}
export function getPageCount(queueLength: number) {
    return Math.ceil(queueLength / tracksPerPage);
}
export function getPageNumber(trackIndex: number) {
    return Math.floor((trackIndex + 1) / tracksPerPage);
}
export function getPageContent(dispatcher: Dispatcher, pageNumber: number) {
    const startIndex = pageNumber * tracksPerPage;
    const currentIndex = dispatcher.queue.currentIndex - startIndex;

    return dispatcher.queue.slice(startIndex, startIndex + tracksPerPage)
        .map((t, i) => {
            const isCur = currentIndex === i;
            return `${isCur ? "**=>**" : `${startIndex + i + 1}]`} ${isCur ? `**[${t.displayTitle}](${t.displayURL})**` : t.displayTitle}`
        })
        .join("\n");
}

export interface GetResponseOptions {
    dispatcher?: Dispatcher,
    page?: number,
    autoPlay?: boolean
}

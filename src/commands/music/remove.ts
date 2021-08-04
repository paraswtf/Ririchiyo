import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX';
import { MusicUtil } from '../../structures/Utils/MusicUtil';
import { EmbedUtils } from '../../structures/Utils';
import { ApplicationCommandData } from 'discord.js';

const multipleIndexRegex = /^[0-9]+(?:\s*,\s*[0-9]+)*$/;
const indexRangeRegex = /^\d+-\d+$/;

export default class RemoveCommand extends BaseCommand<true, false> {
    constructor() {
        super({
            name: "remove",
            category: "music",
            description: "Remove a track from the queue",
            allowGuildCommand: true,
            allowDMCommand: false
        })
    }


    async run(ctx: GuildCTX<false>) {
        const res = MusicUtil.canPerformAction({
            guild: ctx.guild,
            member: ctx.member,
            ctx,
            requiredPermissions: ["MANAGE_QUEUE"],
            memberPermissions: ctx.guildSettings.permissions.members.getFor(ctx.member).calculatePermissions()
        });
        if (res.isError) return;

        if (!res.dispatcher?.queue.length) return await ctx.reply({
            embeds: [EmbedUtils.embedifyString(ctx.guild, "There is nothing playing right now!", { isError: true })],
            ephemeral: true
        });

        let input = ctx.options.get("input")!.value as string;

        //If multiple indexes were provided, separated by a ','
        if (multipleIndexRegex.test(input)) {
            const indexes = input.split(",").filter(v => !!v).map(n => parseInt(n) - 1);

            //If index is out of range
            if (indexes.some(i => i > res.dispatcher!.queue.length - 1 || i < 0)) return await ctx.reply({
                embeds: [EmbedUtils.embedifyString(ctx.guild, "One of the indexes provided is out of range of the queue!", { isError: true })],
                ephemeral: true
            });

            //If the indexes involve removing current track, pls dont
            if (indexes.includes(res.dispatcher.queue.currentIndex)) return await ctx.reply({
                embeds: [EmbedUtils.embedifyString(ctx.guild, "Cannot remove the currently playing track, you may only remove tracks before or after the current one!", { isError: true })],
                ephemeral: true
            });

            //If a single index was provided remove one and return title
            if (indexes.length <= 1) {
                const removed = res.dispatcher.queue.remove(indexes[0])[0];
                return await ctx.reply({
                    embeds: [EmbedUtils.embedifyString(ctx.guild, `${ctx.user} removed **[${removed.displayTitle}](${removed.displayURL})** from the queue.`)]
                });
            }
            //If multiple indexes were provided, return the count of removed tracks
            else {
                for (const i of indexes) res.dispatcher.queue.remove(i);

                return await ctx.reply({
                    embeds: [EmbedUtils.embedifyString(ctx.guild, `${ctx.user} removed **${indexes.length}** tracks from the queue.`)]
                });
            }
        }
        //If the input is a index range
        else if (indexRangeRegex.test(input)) {
            const [start, end] = input.split("-").map(n => parseInt(n) - 1);

            //If one of the index is out of range
            if ([start, end].some(i => i > res.dispatcher!.queue.length - 1 || i < 0)) return await ctx.reply({
                embeds: [EmbedUtils.embedifyString(ctx.guild, "One of the indexes provided is out of range of the queue!", { isError: true })],
                ephemeral: true
            });

            //If the start index is greater than the end WTF
            if (start > end) return await ctx.reply({
                embeds: [EmbedUtils.embedifyString(ctx.guild, "The start index cannot be greater than the end index!", { isError: true })],
                ephemeral: true
            });

            //If the range involves removing current track, pls dont
            if (start === res.dispatcher.queue.currentIndex ||
                end === res.dispatcher.queue.currentIndex ||
                (start < res.dispatcher.queue.currentIndex && end > res.dispatcher.queue.currentIndex)
            ) return await ctx.reply({
                embeds: [EmbedUtils.embedifyString(ctx.guild, "Cannot remove the currently playing track, you may only remove tracks before or after the current one!", { isError: true })],
                ephemeral: true
            });

            const removed = res.dispatcher.queue.remove(start, end);

            return await ctx.reply({
                embeds: [EmbedUtils.embedifyString(ctx.guild, `${ctx.user} removed **${removed.length}** tracks from the queue.`)]
            });
        }
        //If the input is a search term
        else {
            const found = res.dispatcher.queue.findByQuery(input);
            if (found < 0) return await ctx.reply({
                embeds: [EmbedUtils.embedifyString(ctx.guild, "Could not find that track in the queue!", { isError: true })],
                ephemeral: true
            });

            //If the index is the current track, pls dont
            if (found === res.dispatcher.queue.currentIndex) return await ctx.reply({
                embeds: [EmbedUtils.embedifyString(ctx.guild, "Cannot remove the currently playing track, you may only remove tracks before or after the current one!", { isError: true })],
                ephemeral: true
            });

            const removed = res.dispatcher.queue.remove(found)[0];
            return await ctx.reply({
                embeds: [EmbedUtils.embedifyString(ctx.guild, `${ctx.user} removed **[${removed.displayTitle}](${removed.displayURL})** from the queue.`)]
            });
        }

    }

    slashCommandData: ApplicationCommandData = {
        name: this.name,
        description: this.description,
        options: [
            {
                name: "input",
                description: "The name or index of tracks",
                type: "STRING",
                required: true
            }
        ]
    }
}

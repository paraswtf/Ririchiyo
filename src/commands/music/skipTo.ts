import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX';
import { MusicUtil } from '../../structures/Utils/MusicUtil';
import { EmbedUtils } from '../../structures/Utils';
import { ApplicationCommandData } from 'discord.js';
import Dispatcher from '../../structures/Shoukaku/Dispatcher';

export default class SkipToCommand extends BaseCommand<true, false> {
    constructor() {
        super({
            name: "skipto",
            category: "music",
            description: "Skip to a song in the queue",
            allowGuildCommand: true,
            allowDMCommand: false
        })
    }


    async run(ctx: GuildCTX<false>) {
        //Use forceSkip if no options provided
        if (!ctx.options.size) return this.client.commands.get("forceskip")!.run(ctx);

        const res = MusicUtil.canPerformAction({
            guild: ctx.guild,
            member: ctx.member,
            ctx,
            requiredPermissions: ["MANAGE_PLAYER"],
            memberPermissions: ctx.guildSettings.permissions.members.getFor(ctx.member).calculatePermissions()
        });
        if (res.isError) return;

        if (!res.dispatcher?.queue.length) return await ctx.reply({
            embeds: [EmbedUtils.embedifyString(ctx.guild, "There is nothing playing right now!", { isError: true })]
        });

        let input = ctx.options.first()!.value as string | number;

        if (typeof input === "number") {
            if (!res.dispatcher.queue[--input]) return await ctx.reply({
                embeds: [EmbedUtils.embedifyString(ctx.guild, "That track doesn't exist in the queue!", { isError: true })]
            });
            await setIndexAndPlay(res.dispatcher, input);
        }
        else {
            const found = res.dispatcher.queue.findByQuery(input);
            if (found < 0) return await ctx.reply({
                embeds: [EmbedUtils.embedifyString(ctx.guild, "Could not find that track in the queue!", { isError: true })]
            });
            await setIndexAndPlay(res.dispatcher, found);
        }

        const options = {
            embeds: [
                EmbedUtils.embedifyString(ctx.guild, `${ctx.member} Skipped to [${res.dispatcher.queue.current?.displayTitle ?? "UNKNOWN_TRACK"}](${res.dispatcher.queue.current?.displayURL})`)
            ]
        };

        await ctx.reply(options);
        if (res.dispatcher.textChannel && ctx.channel.id !== res.dispatcher.textChannel.id) await res.dispatcher.sendMessage(options);

    }

    slashCommandData: ApplicationCommandData = {
        name: this.name,
        description: this.description,
        options: [
            {
                name: "query",
                description: "Search and skip to a song",
                type: "STRING",
                required: false
            },
            {
                name: "index",
                description: "The index of the song to skip to",
                type: "INTEGER",
                required: false
            }
        ]
    }
}

//Returns ended message options
async function setIndexAndPlay(dispatcher: Dispatcher, index: number) {
    if (dispatcher.queue.current) dispatcher.playingMessages.deleteMessage(dispatcher.queue.current.id);
    dispatcher.queue.setCurrentIndex(index);
    await dispatcher.play();
    return dispatcher.queue.current!;
}

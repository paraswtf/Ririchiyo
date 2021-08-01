import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX';
import { MusicUtil } from '../../structures/Utils/MusicUtil';
import { EmbedUtils } from '../../structures/Utils';
import { ApplicationCommandData } from 'discord.js';

export default class ForceBackCommand extends BaseCommand<true, false> {
    constructor() {
        super({
            name: "back",
            category: "music",
            description: "Play the previuos track",
            allowGuildCommand: true,
            allowDMCommand: false
        })
    }

    async run(ctx: GuildCTX<false>) {
        const res = MusicUtil.canPerformAction({
            guild: ctx.guild,
            member: ctx.member,
            ctx,
            requiredPermissions: ["MANAGE_PLAYER"],
            memberPermissions: ctx.guildSettings.permissions.members.getFor(ctx.member).calculatePermissions()
        });
        if (res.isError) return;

        if (!res.dispatcher?.queue.previousTracks.length) return await ctx.reply({
            embeds: [EmbedUtils.embedifyString(ctx.guild, "There are no previous tracks!", { isError: true })]
        });

        if (res.dispatcher.queue.current) res.dispatcher.playingMessages.deleteMessage(res.dispatcher.queue.current.id);

        res.dispatcher.queue.setCurrentIndex(res.dispatcher.queue.currentIndex - 1);
        await res.dispatcher.play();

        const options = {
            embeds: [
                EmbedUtils.embedifyString(ctx.guild, `${ctx.member} Skipped to the previous song!`)
            ]
        };

        await ctx.reply(options);
        if (res.dispatcher.textChannel && ctx.channel.id !== res.dispatcher.textChannel.id) await res.dispatcher.sendMessage(options);

    }

    slashCommandData: ApplicationCommandData = {
        name: this.name,
        description: this.description
    }
}

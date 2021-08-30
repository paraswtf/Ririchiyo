import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX';
import { MusicUtil } from '../../structures/Utils/music/MusicUtil';
import { EmbedUtils } from '../../structures/Utils';
import { ApplicationCommandData } from 'discord.js';

export default class PauseCommand extends BaseCommand<true, true> {
    constructor() {
        super({
            name: "pause",
            category: "music",
            description: "Pause the player",
            allowGuildCommand: true,
            allowDMCommand: false,
            allowMessageCommponentInteraction: true
        })
    }

    async run(ctx: GuildCTX<true>) {
        const res = MusicUtil.canPerformAction({
            guild: ctx.guild,
            member: ctx.member,
            ctx,
            requiredPermissions: ["MANAGE_PLAYER"],
            memberPermissions: ctx.guildSettings.permissions.members.getFor(ctx.member).calculatePermissions()
        });
        if (res.isError) return;

        if (res.dispatcher && res.dispatcher.player.paused) return await ctx.reply({
            embeds: [EmbedUtils.embedifyString(ctx.guild, "The player is already paused!", { isError: true })],
            ephemeral: true
        });
        if (!res.dispatcher?.queue.current) return await ctx.reply({
            embeds: [EmbedUtils.embedifyString(ctx.guild, "There is nothing playing right now!", { isError: true })],
            ephemeral: true
        });

        res.dispatcher.player.setPaused(true);

        await res.dispatcher.playingMessages.get(res.dispatcher.queue.current.id)?.setPause(true);

        const options = { embeds: [EmbedUtils.embedifyString(ctx.guild, `${ctx.user} Paused the player!`)] };

        await ctx.reply(options, { deleteLater: true });
        if (res.dispatcher.textChannel && ctx.channel.id !== res.dispatcher.textChannel.id) await res.dispatcher.sendMessage(options);
    }

    slashCommandData: ApplicationCommandData = {
        name: this.name,
        description: this.description
    }
}

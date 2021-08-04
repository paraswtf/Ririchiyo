import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX';
import { MusicUtil } from '../../structures/Utils/MusicUtil';
import { EmbedUtils } from '../../structures/Utils';
import { ApplicationCommandData } from 'discord.js';

export default class ResumeCommand extends BaseCommand<true, true>{
    constructor() {
        super({
            name: "resume",
            category: "music",
            description: "Resume the player",
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

        if (res.dispatcher && res.dispatcher.queue.current && !res.dispatcher.player.paused) return await ctx.reply({
            embeds: [EmbedUtils.embedifyString(ctx.guild, "The player is already playing!", { isError: true })],
            ephemeral: true
        });
        if (!res.dispatcher?.queue.current) return await ctx.reply({
            embeds: [EmbedUtils.embedifyString(ctx.guild, "There is nothing playing right now!", { isError: true })],
            ephemeral: true
        });

        res.dispatcher.player.setPaused(false);

        await res.dispatcher.playingMessages.get(res.dispatcher.queue.current.id)?.setPause(false);

        const options = { embeds: [EmbedUtils.embedifyString(ctx.guild, `${ctx.user} Resumed the player!`)] };

        await ctx.reply(options, { deleteLater: true });
        if (res.dispatcher?.textChannel && ctx.channel.id !== res.dispatcher.textChannel.id) await res.dispatcher.sendMessage(options);
    }

    slashCommandData: ApplicationCommandData = {
        name: this.name,
        description: this.description
    }
}

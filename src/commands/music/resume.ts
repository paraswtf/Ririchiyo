import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX';
import { MusicUtil, Error, Success, FLAG } from '../../structures/Utils/MusicUtil';
import { Util as DCUtil, MessageEmbed } from 'discord.js';
import { CustomEmojiUtils, EmbedUtils, ThemeUtils } from '../../structures/Utils';

export default class ResumeCommand extends BaseCommand {
    constructor() {
        super({
            name: "resume",
            category: "music",
            description: "Resume the player",
            allowSlashCommand: true,
            allowMessageCommand: true,
            allowGuildCommand: true,
            allowDMCommand: false,
            allowMessageCommponentInteraction: true
        })
    }

    async run(ctx: GuildCTX, opts?: Success | Error) {
        const res = MusicUtil.canPerformAction({
            guild: ctx.guild,
            member: ctx.member,
            ctx,
            requiredPermissions: ["MANAGE_PLAYER"],
            memberPermissions: ctx.guildSettings.permissions.members.getFor(ctx.member).calculatePermissions()
        });
        if (res.isError) return;

        if (res.dispatcher && res.dispatcher.queue.current && !res.dispatcher.player.paused) return await ctx.reply({ embeds: [EmbedUtils.embedifyString(ctx.guild, "The player is already playing!", { isError: true })] });
        if (!res.dispatcher?.queue.current) return await ctx.reply({ embeds: [EmbedUtils.embedifyString(ctx.guild, "There is nothing playing right now!", { isError: true })] });

        res.dispatcher.player.setPaused(false);

        await res.dispatcher.playingMessages.get(res.dispatcher.queue.current.id)?.setPause(false);

        const options = { embeds: [EmbedUtils.embedifyString(ctx.guild, `${ctx.author} Resumed the player!`)] };

        await ctx.reply(options);
        if (res.dispatcher?.textChannel && ctx.channel.id !== res.dispatcher.textChannel.id) await res.dispatcher.textChannel.send(options);
    }
}

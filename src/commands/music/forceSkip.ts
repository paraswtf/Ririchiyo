import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX';
import { MusicUtil } from '../../structures/Utils/music/MusicUtil';
import { EmbedUtils } from '../../structures/Utils';
import { ApplicationCommandData } from 'discord.js';
import { skipTrack } from './skip';

export default class ForceSkipCommand extends BaseCommand<true, false> {
    constructor() {
        super({
            name: "forceskip",
            category: "music",
            description: "Force Skip the current track",
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

        if (!res.dispatcher?.queue.current) return await ctx.reply({
            embeds: [EmbedUtils.embedifyString(ctx.guild, "There is nothing playing right now!", { isError: true })],
            ephemeral: true
        });


        await skipTrack(res.dispatcher);
        const options = {
            embeds: [
                EmbedUtils.embedifyString(ctx.guild, `${ctx.member} Skipped the current song!`)
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

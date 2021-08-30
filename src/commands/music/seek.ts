import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX';
import { MusicUtil } from '../../structures/Utils/music/MusicUtil';
import { EmbedUtils } from '../../structures/Utils';
import { ApplicationCommandData } from 'discord.js';

export default class SeekCommand extends BaseCommand<true, false> {
    constructor() {
        super({
            name: "seek",
            category: "music",
            description: "Seek to a specific position in a song",
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

        //Parse the query if any
        const pos = ctx.interaction.options.get("position")?.value as number;


        const options = { embeds: [EmbedUtils.embedifyString(ctx.guild, `${ctx.user} Shuffled the player queue!`)] };

        await ctx.reply(options, { deleteLater: true });
        if (res.dispatcher.textChannel && ctx.channel.id !== res.dispatcher.textChannel.id) await res.dispatcher.sendMessage(options);
    }

    slashCommandData: ApplicationCommandData = {
        name: this.name,
        description: this.description,
        options: [
            {
                name: "position",
                description: "The position in the song in ms",
                type: "INTEGER",
                required: true
            }
        ]
    }
}

import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX';
import { MusicUtil } from '../../structures/Utils/MusicUtil';
import { EmbedUtils } from '../../structures/Utils';
import { ApplicationCommandData } from 'discord.js';

export default class ShuffleCommand extends BaseCommand {
    constructor() {
        super({
            name: "shuffle",
            aliases: ["shuff"],
            category: "music",
            description: "Shuffle the player queue",
            allowSlashCommand: true,
            allowMessageCommand: true,
            allowGuildCommand: true,
            allowDMCommand: false,
            allowMessageCommponentInteraction: true
        })
    }

    async run(ctx: GuildCTX) {
        const res = MusicUtil.canPerformAction({
            guild: ctx.guild,
            member: ctx.member,
            ctx,
            requiredPermissions: ["MANAGE_QUEUE"],
            memberPermissions: ctx.guildSettings.permissions.members.getFor(ctx.member).calculatePermissions()
        });
        if (res.isError) return;

        if (!res.dispatcher?.queue.current) return await ctx.reply({ embeds: [EmbedUtils.embedifyString(ctx.guild, "There is nothing playing right now!", { isError: true })] });

        res.dispatcher.queue.shuffle();

        const options = { embeds: [EmbedUtils.embedifyString(ctx.guild, `${ctx.author} Shuffled the player queue!`)] };

        await ctx.reply(options, { deleteLater: true });
        if (res.dispatcher.textChannel && ctx.channel.id !== res.dispatcher.textChannel.id) await res.dispatcher.sendMessage(options);
    }

    get slashCommandData(): ApplicationCommandData {
        return {
            name: this.name,
            description: this.description
        }
    }
}

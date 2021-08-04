import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX';
import { MusicUtil } from '../../structures/Utils/MusicUtil';
import { EmbedUtils } from '../../structures/Utils';
import { ApplicationCommandData } from 'discord.js';

export default class DisconnectCommand extends BaseCommand<true, false> {
    constructor() {
        super({
            name: "disconnect",
            category: "music",
            description: "Disconnect the player and clear the queue",
            allowGuildCommand: true,
            allowDMCommand: false
        })
    }

    async run(ctx: GuildCTX<false>) {
        const res = MusicUtil.canPerformAction({
            guild: ctx.guild,
            member: ctx.member,
            ctx,
            requiredPermissions: ["MANAGE_PLAYER", "MANAGE_QUEUE"],
            memberPermissions: ctx.guildSettings.permissions.members.getFor(ctx.member).calculatePermissions()
        });
        if (res.isError) return;

        await this.client.dispatchers.destroy(ctx.guild.id);

        const options = {
            embeds: [
                EmbedUtils.embedifyString(ctx.guild, `${ctx.member} Disconnected me from the voice channel!\nThe queue was also cleared :/`)
            ]
        };

        await ctx.reply(options);
        if (res.dispatcher!.textChannel && ctx.channel.id !== res.dispatcher!.textChannel.id) await res.dispatcher!.sendMessage(options);

    }

    slashCommandData: ApplicationCommandData = {
        name: this.name,
        description: this.description
    }
}

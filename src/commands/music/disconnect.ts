import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX';
import { MusicUtil } from '../../structures/Utils/MusicUtil';
import { EmbedUtils } from '../../structures/Utils';
import { ApplicationCommandData } from 'discord.js';
import { inspect } from 'util';

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
        let dispatcher = this.client.dispatchers.get(ctx.guild.id);
        const res = MusicUtil.canPerformAction({
            guild: ctx.guild,
            member: ctx.member,
            ctx,
            requiredPermissions: ["MANAGE_PLAYER", "MANAGE_QUEUE"],
            memberPermissions: ctx.guildSettings.permissions.members.getFor(ctx.member).calculatePermissions()
        });
        if (res.isError) return;

        if (!dispatcher) dispatcher = res.dispatcher;
        if (!dispatcher) return await ctx.reply({
            embeds: [EmbedUtils.embedifyString(ctx.guild, "There is nothing playing right now!", { isError: true })],
            ephemeral: true
        });

        await this.client.dispatchers.destroy(ctx.guild.id);

        const options = {
            embeds: [
                EmbedUtils.embedifyString(ctx.guild, `${ctx.member} Disconnected me from the voice channel!\nThe queue was also cleared :/`)
            ]
        };

        await ctx.reply(options);
        if (dispatcher.textChannel && ctx.channel.id !== dispatcher.textChannel.id) await dispatcher.sendMessage(options);

    }

    slashCommandData: ApplicationCommandData = {
        name: this.name,
        description: this.description
    }
}

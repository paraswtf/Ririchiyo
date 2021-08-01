import { EmbedUtils } from '../../structures/Utils';
import { ApplicationCommandData } from 'discord.js';
import BaseCommand from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX'
import { FLAG, MusicUtil } from '../../structures/Utils/MusicUtil';

export default class VolumeCommand extends BaseCommand<true, false>{
    constructor() {
        super({
            name: "volume",
            category: "music",
            description: "Change the player volume",
            allowGuildCommand: true,
            allowDMCommand: false
        });
    }

    async run(ctx: GuildCTX<false>) {
        const res = MusicUtil.canPerformAction({
            guild: ctx.guild,
            member: ctx.member,
            ctx,
            requiredPermissions: ["MANAGE_PLAYER"],
            memberPermissions: ctx.guildSettings.permissions.members.getFor(ctx.member).calculatePermissions(),
            noDispatcherRequired: true,
            allowViewOnly: !ctx.options?.size
        });

        if (res.isError) return;

        const input = ctx.options.get("value")?.value as number | undefined;
        let volume = res.dispatcher?.player.filters.volume || ctx.guildSettings.music.filters.volume;

        if (typeof input !== "number" || res.flag === FLAG.VIEW_ONLY) return await ctx.reply({
            embeds: [EmbedUtils.embedifyString(ctx.guild, `The player volume is currently set to ${volume * 100}%.`)]
        });
        else if (input > 500 || input < 0) return await ctx.reply({
            embeds: [EmbedUtils.embedifyString(ctx.guild, "Please provide a numeric value between 0 and 500 to set the volume to!", { isError: true })]
        });

        const finalVolume = Math.min(5, Math.max(0, input / 100));
        await res.dispatcher?.player.setVolume(finalVolume);
        if (res.memberPerms.has("MANAGE_PLAYER")) await ctx.guildSettings.music.filters.setVolume(finalVolume);

        const options = { embeds: [EmbedUtils.embedifyString(ctx.guild, `${ctx.member} Set the player volume to ${Math.round(input)}%.`)] };

        await ctx.reply(options, { deleteLater: !!res.dispatcher });
        if (res.dispatcher?.textChannel && ctx.channel.id !== res.dispatcher.textChannel.id) await res.dispatcher.sendMessage(options);
    }

    slashCommandData: ApplicationCommandData = {
        name: this.name,
        description: this.description,
        options: [
            {
                name: "value",
                description: "The value to set for the volume",
                type: "INTEGER",
                required: false
            }
        ]
    }
}

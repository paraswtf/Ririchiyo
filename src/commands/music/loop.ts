import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX';
import { MusicUtil, Error, Success, FLAG } from '../../structures/Utils/MusicUtil';
import { Util as DCUtil, MessageEmbed } from 'discord.js';
import { CustomEmojiUtils, EmbedUtils, ThemeUtils } from '../../structures/Utils';

export default class LoopCommand extends BaseCommand {
    constructor() {
        super({
            name: "loop",
            aliases: ["l"],
            category: "music",
            description: "Change the player loop state",
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
            requiredPermissions: ["MANAGE_PLAYER"],
            memberPermissions: ctx.guildSettings.permissions.members.getFor(ctx.member).calculatePermissions(),
            noDispatcherRequired: true,
            allowViewOnly: !ctx.args
        });
        if (res.isError) return;

        let loop = res.dispatcher?.queue.loopState || ctx.guildSettings.music.loopState;

        if (res.flag === FLAG.VIEW_ONLY) return await ctx.reply({ embeds: [EmbedUtils.embedifyString(ctx.guild, `The loop is currently set to ${loop}!`)] }, { ephemeral: true });

        switch (ctx.args ? parseOptions(ctx.args[0]) : loop) {
            case "QUEUE":
                loop = "TRACK";
                res.dispatcher?.queue.setLoopState(loop);
                if (res.memberPerms.has("MANAGE_PLAYER")) ctx.guildSettings.music.setLoopState(loop);
                break;
            case "TRACK":
                loop = "DISABLED";
                res.dispatcher?.queue.setLoopState(loop);
                if (res.memberPerms.has("MANAGE_PLAYER")) ctx.guildSettings.music.setLoopState(loop);
                break;
            default:
                loop = "QUEUE";
                res.dispatcher?.queue.setLoopState(loop);
                if (res.memberPerms.has("MANAGE_PLAYER")) ctx.guildSettings.music.setLoopState(loop);
                break;
        }

        if (res.dispatcher?.queue.current) await res.dispatcher.playingMessages.get(res.dispatcher.queue.current.id)?.setLoopState(loop);

        const options = { embeds: [EmbedUtils.embedifyString(ctx.guild, `${ctx.member} Set the loop to ${loop.toLowerCase()}.`)] };

        await ctx.reply(options);
        if (res.dispatcher?.textChannel && ctx.channel.id !== res.dispatcher.textChannel.id) await res.dispatcher.sendMessage(options);
    }
}

function parseOptions(option: string) {
    switch (option) {
        case "d":
        case "disable":
        case "stop":
        case "off":
        case "no":
            return "TRACK";
        case "t":
        case "track":
        case "song":
        case "this":
        case "current":
        case "one":
        case "playing":
            return "QUEUE";
        case "q":
        case "queue":
        case "entire":
        case "all":
        case "playlist":
        case "everything":
            return "DISABLED";
        default: return;
    }
}

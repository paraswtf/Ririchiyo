import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX';
import { MusicUtil, FLAG } from '../../structures/Utils/MusicUtil';
import { EmbedUtils } from '../../structures/Utils';
import { ApplicationCommandData, CommandInteraction } from 'discord.js';

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

        if (res.flag === FLAG.VIEW_ONLY) return await ctx.reply({ embeds: [EmbedUtils.embedifyString(ctx.guild, `The loop is currently set to ${loop}!`)] });

        let option;
        if (ctx.isInteraction && ctx.message.isCommand()) option = ctx.message.options.get("value")?.value || loop;
        else option = ctx.args ? parseOptions(ctx.args[0]) : loop;

        switch (option) {
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

        await ctx.reply(options, { deleteLater: true });
        if (res.dispatcher?.textChannel && ctx.channel.id !== res.dispatcher.textChannel.id) await res.dispatcher.sendMessage(options);
    }

    get slashCommandData(): ApplicationCommandData {
        return {
            name: this.name,
            description: this.description,
            options: [
                {
                    name: "value",
                    description: "The song link or name to search for",
                    type: "STRING",
                    required: false,
                    choices: [
                        {
                            name: "QUEUE",
                            value: "q"
                        },
                        {
                            name: "TRACK",
                            value: "t"
                        },
                        {
                            name: "DISABLE",
                            value: "d"
                        }
                    ]
                }
            ]
        }
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

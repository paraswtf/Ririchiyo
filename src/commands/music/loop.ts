import { EmbedUtils } from '../../structures/Utils';
import { ApplicationCommandData } from 'discord.js';
import BaseCommand from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX'
import { FLAG, MusicUtil } from '../../structures/Utils/music/MusicUtil';
import { QueueLoopState } from '../../structures/Shoukaku/Queue';

export default class LoopCommand extends BaseCommand<true, true>{
    constructor() {
        super({
            name: "loop",
            category: "music",
            description: "Change the player loop state",
            allowGuildCommand: true,
            allowDMCommand: false,
            allowMessageCommponentInteraction: true
        });
    }

    async run(ctx: GuildCTX<true>) {
        //Get user input
        const input = ctx.options?.get("value")?.value as QueueLoopState | undefined;

        const res = MusicUtil.canPerformAction({
            guild: ctx.guild,
            member: ctx.member,
            ctx,
            requiredPermissions: ["MANAGE_PLAYER"],
            memberPermissions: ctx.guildSettings.permissions.members.getFor(ctx.member).calculatePermissions(),
            noDispatcherRequired: true,
            noVoiceChannelRequired: true,
            allowViewOnly: !input
        });

        if (res.isError) return;

        let loop = res.dispatcher?.queue.loopState || ctx.guildSettings.music.loopState;

        if (res.flag === FLAG.VIEW_ONLY) return await ctx.reply({
            embeds: [EmbedUtils.embedifyString(ctx.guild, `The loop is currently set to ${loop}!`)]
        }, { deleteLater: !!res.dispatcher?.queue.current });

        switch (input || getNextLoopState(loop)) {
            case "QUEUE":
                loop = "QUEUE";
                res.dispatcher?.queue.setLoopState(loop);
                if (res.memberPerms.has("MANAGE_PLAYER")) ctx.guildSettings.music.setLoopState(loop);
                break;
            case "TRACK":
                loop = "TRACK";
                res.dispatcher?.queue.setLoopState(loop);
                if (res.memberPerms.has("MANAGE_PLAYER")) ctx.guildSettings.music.setLoopState(loop);
                break;
            case "DISABLED":
            default:
                loop = "DISABLED";
                res.dispatcher?.queue.setLoopState(loop);
                if (res.memberPerms.has("MANAGE_PLAYER")) ctx.guildSettings.music.setLoopState(loop);
                break;
        }

        if (res.dispatcher?.queue.current) await res.dispatcher.playingMessages.get(res.dispatcher.queue.current.id)?.setLoopState(loop);

        const options = {
            embeds: [EmbedUtils.embedifyString(ctx.guild, `${ctx.member} Set the loop to ${loop.toLowerCase()}.`)]
        };

        await ctx.reply(options, { deleteLater: !!res.dispatcher });
        if (res.dispatcher?.textChannel && ctx.channel.id !== res.dispatcher.textChannel.id) await res.dispatcher.sendMessage(options);
    }

    slashCommandData: ApplicationCommandData = {
        name: this.name,
        description: this.description,
        options: [
            {
                name: "value",
                description: "The value to set for the loop",
                type: "STRING",
                required: false,
                choices: [
                    {
                        name: "disable",
                        value: "DISABLED"
                    },
                    {
                        name: "queue",
                        value: "QUEUE"
                    },
                    {
                        name: "track",
                        value: "TRACK"
                    }
                ]
            }
        ]
    }
}

function getNextLoopState(option: QueueLoopState): QueueLoopState {
    switch (option) {
        case "DISABLED": return "QUEUE";
        case "QUEUE": return "TRACK";
        case "TRACK":
        default: return "DISABLED";
    }
}


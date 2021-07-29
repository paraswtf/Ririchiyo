import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX';
import { MusicUtil, Error, Success, FLAG } from '../../structures/Utils/MusicUtil';
import { Util as DCUtil, MessageEmbed, MessageComponentInteraction } from 'discord.js';
import { CustomEmojiUtils, EmbedUtils, ThemeUtils } from '../../structures/Utils';

export default class ForceSkipCommand extends BaseCommand {
    constructor() {
        super({
            name: "forceskip",
            category: "music",
            description: "Force Skip the current track",
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
            requiredPermissions: ["MANAGE_PLAYER", "MANAGE_QUEUE"],
            memberPermissions: ctx.guildSettings.permissions.members.getFor(ctx.member).calculatePermissions()
        });
        if (res.isError) return;

        if (!res.dispatcher?.queue.current) return await ctx.reply({ embeds: [EmbedUtils.embedifyString(ctx.guild, "There is nothing playing right now!", { isError: true })] });

        res.dispatcher.playingMessages.deleteMessage(res.dispatcher.queue.current.id);
        res.dispatcher.queue.next();
        let endedMessageOptions = null;
        if (res.dispatcher.queue.current) await res.dispatcher.play();
        else {
            await res.dispatcher.player.stopTrack();
            endedMessageOptions = {
                embeds: [
                    EmbedUtils.embedifyString(res.dispatcher.guild, "The player queue has ended.")
                ]
            }
        }

        const options = { embeds: [EmbedUtils.embedifyString(ctx.guild, `${ctx.member} Force skipped the current song!`)] };

        await ctx.reply(options, { deleteLater: true });
        if (res.dispatcher.textChannel && ctx.channel.id !== res.dispatcher.textChannel.id) await res.dispatcher.sendMessage(options);
        if (endedMessageOptions) await res.dispatcher.sendMessage(endedMessageOptions);
    }
}

import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX';
import { MusicUtil, Success } from '../../structures/Utils/MusicUtil';
import { EmbedUtils } from '../../structures/Utils';
import { ApplicationCommandData } from 'discord.js';

export default class SkipCommand extends BaseCommand {
    constructor() {
        super({
            name: "skip",
            aliases: ['skip', 's', 'voteskip', 'vs'],
            category: "music",
            description: "Vote to skip the current track",
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
            requiredPermissions: [],
            memberPermissions: ctx.guildSettings.permissions.members.getFor(ctx.member).calculatePermissions()
        });
        if (res.isError) return;

        const clientVoiceChannel = ctx.guild.me?.voice.channel;
        if (!res.dispatcher?.queue.current || !clientVoiceChannel) return await ctx.reply({ embeds: [EmbedUtils.embedifyString(ctx.guild, "There is nothing playing right now!", { isError: true })] });

        const playingMessage = res.dispatcher.playingMessages.get(res.dispatcher.queue.current.id);
        if (!playingMessage) return;

        if (playingMessage.skipVotes.has(ctx.author.id)) return await ctx.reply({ embeds: [EmbedUtils.embedifyString(ctx.guild, "You have already voted to skip!", { isError: true })] });
        else {
            let endedMessageOptions = null;
            let requiredVoteCount = Math.floor(clientVoiceChannel.members.filter(m => m.user.bot).size / 3);
            let currentVoteCount = playingMessage.skipVotes.filter(m => !!m.voice.channel && m.voice.channel.id === clientVoiceChannel.id).size;

            //If the required votes are less than or equal to 1
            if (requiredVoteCount <= 1) {
                endedMessageOptions = await skipTrack(res);
                const options = {
                    embeds: [
                        EmbedUtils.embedifyString(ctx.guild, `${ctx.member} Skipped the current song!`)
                    ]
                };

                await ctx.reply(options);
                if (res.dispatcher.textChannel && ctx.channel.id !== res.dispatcher.textChannel.id) await res.dispatcher.sendMessage(options);
            }
            else {
                playingMessage.skipVotes.set(ctx.member.id, ctx.member);
                ++currentVoteCount;

                let options;

                //Handle skip if vote count reached
                if (requiredVoteCount <= currentVoteCount) {
                    endedMessageOptions = await skipTrack(res);
                    options = {
                        embeds: [
                            EmbedUtils.embedifyString(ctx.guild, `${ctx.member} Voted to skip the current song!\nReceived \`[${currentVoteCount}/${requiredVoteCount}]\` votes.\nI yeeted the current song outta the player queue! OwO`)
                        ]
                    };
                }
                else {
                    options = {
                        embeds: [
                            EmbedUtils.embedifyString(ctx.guild, `${ctx.member} Voted to skip the current song! \`[${currentVoteCount}/${requiredVoteCount}]\``)
                        ]
                    };
                }

                await ctx.reply(options);
                if (res.dispatcher.textChannel && ctx.channel.id !== res.dispatcher.textChannel.id) await res.dispatcher.sendMessage(options);
            }
            if (endedMessageOptions) await res.dispatcher.sendMessage(endedMessageOptions);
        }

    }

    get slashCommandData(): ApplicationCommandData {
        return {
            name: this.name,
            description: this.description
        }
    }
}

//Returns ended message options
async function skipTrack(res: Success) {
    if (!res.dispatcher?.queue.current) return null;

    res.dispatcher.playingMessages.deleteMessage(res.dispatcher.queue.current.id);
    res.dispatcher.queue.next(true);

    if (res.dispatcher.queue.current) await res.dispatcher.play();
    else {
        await res.dispatcher.player.stopTrack();
        return {
            embeds: [
                EmbedUtils.embedifyString(res.dispatcher.guild, "The player queue has ended.")
            ]
        }
    }

    return null;
}

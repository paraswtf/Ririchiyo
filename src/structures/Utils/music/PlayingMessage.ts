import {
    Message,
    MessageEmbed,
    MessageButton,
    InteractionCollector,
    MessageComponentInteraction,
    Collection,
    GuildMember
} from 'discord.js';
import { ResolvedTrack } from '../../Shoukaku/RirichiyoTrack';
import Utils from '..';
import CustomEmojiUtils from '../ui/CustomEmojiUtils';
import ThemeUtils from '../ui/ThemeUtils';
import PlayingMessageManager from './PlayingMessageManager';
import { QueueLoopState } from '../../Shoukaku/Queue';

export default class PlayingMessage {
    // Class props //
    readonly manager: PlayingMessageManager;
    readonly track: ResolvedTrack;
    message?: Message;
    doNotSend: boolean = false;
    components: MessageButton[];
    collector?: InteractionCollector<MessageComponentInteraction>;
    skipVotes: Collection<string, GuildMember> = new Collection();
    backVotes: Collection<string, GuildMember> = new Collection();
    // Class props //

    constructor(manager: PlayingMessageManager, track: ResolvedTrack) {
        this.manager = manager;
        this.track = track;
        this.components = [
            new MessageButton({
                customId: Utils.generateButtonID('shuffle'),
                style: 'PRIMARY',
                emoji: CustomEmojiUtils.get("SHUFFLE_BUTTON").identifier
            }),
            new MessageButton({
                customId: Utils.generateButtonID('back'),
                style: 'PRIMARY',
                emoji: CustomEmojiUtils.get("PREVIOUS_BUTTON").identifier
            }),
            new MessageButton({
                customId: Utils.generateButtonID('pause'),
                style: 'PRIMARY',
                emoji: CustomEmojiUtils.get("PAUSE_BUTTON").identifier
            }),
            new MessageButton({
                customId: Utils.generateButtonID('skip'),
                style: 'PRIMARY',
                emoji: CustomEmojiUtils.get("NEXT_BUTTON").identifier
            }),
            new MessageButton({
                customId: Utils.generateButtonID('loop'),
                style: 'PRIMARY',
                emoji: CustomEmojiUtils.get(getLoopStateButtonName(this.manager.dispatcher.queue.loopState)).identifier
            })
        ];
    }

    async send() {
        if (this.message) return this.message;

        const playingEmbed = new MessageEmbed({
            title: `${CustomEmojiUtils.get("MUSICAL_NOTES")} Started playing! ${CustomEmojiUtils.get("ANIMATED_PLAYING")}`,
            description: `**[${this.track.displayTitle}](${this.track.displayURL})**\n` + (this.track.requester ? `\`Added by - \`${this.track.requester}\` \`` : `\`Recommended based on previous tracks\``),
            image: {
                url: "https://cdn.discordapp.com/attachments/756541902202863740/780739509704327198/1920x1_TP.png"
            },
            thumbnail: {
                url: this.track.displayThumbnail("mqdefault")
            },
            color: ThemeUtils.getClientColor(this.manager.dispatcher.guild)
        });

        this.message = await this.manager.dispatcher.sendMessage({
            embeds: [playingEmbed],
            components: [
                {
                    type: 1,
                    components: this.components
                }
            ]
        }).catch(Utils.client.logger.error);

        if (this.doNotSend) return this.delete();
    }

    async setPause(value: boolean, editMessage = true) {
        this.components[2]
            .setCustomId(Utils.generateButtonID(value ? 'resume' : 'pause'))
            .setEmoji(CustomEmojiUtils.get(value ? "RESUME_BUTTON" : "PAUSE_BUTTON").identifier);

        if (editMessage) await this.message?.edit({
            components: [
                {
                    type: 1,
                    components: this.components
                }
            ]
        });
    }

    async setLoopState(value: QueueLoopState, editMessage = true) {
        this.components[4]
            .setEmoji(CustomEmojiUtils.get(getLoopStateButtonName(value)).identifier);

        if (editMessage) await this.message?.edit({
            components: [
                {
                    type: 1,
                    components: this.components
                }
            ]
        });
    }

    delete() {
        if (!this.message) return this.doNotSend = true;
        this.collector?.stop();
        if (this.message.deletable && !this.message.deleted) this.message.delete().catch(Utils.client.logger.error);
        delete this.message;
    }
}

function getLoopStateButtonName(state: QueueLoopState): "LOOP_DISABLED_BUTTON" | "LOOP_QUEUE_BUTTON" | "LOOP_TRACK_BUTTON" {
    switch (state) {
        case "TRACK": return "LOOP_TRACK_BUTTON";
        case "QUEUE": return "LOOP_QUEUE_BUTTON";
        default: return "LOOP_DISABLED_BUTTON";
    }
}

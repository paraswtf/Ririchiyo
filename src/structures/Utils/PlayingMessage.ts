import { Util as DCUtil, Message, MessageEmbed, MessageButton } from 'discord.js';
import { ExtendedShoukakuPlayer } from '../Shoukaku/Dispatcher';
import { ResolvedTrack } from '../Shoukaku/RirichiyoTrack';
import Utils from '../Utils';
import CustomEmojiUtils from './CustomEmojiUtils';
import ThemeUtils from './ThemeUtils';
import PermissionUtils from './PermissionUtils';
import PlayingMessageManager from './PlayingMessageManager';
import { QueueLoopState } from '../Shoukaku/Queue';
import { CustomEmojiName } from '../../config';

export default class PlayingMessage {
    // Class props //
    readonly manager: PlayingMessageManager;
    readonly track: ResolvedTrack;
    message?: Message;
    doNotSend: boolean = false;
    components: MessageButton[];
    // Class props //

    constructor(manager: PlayingMessageManager, track: ResolvedTrack) {
        this.manager = manager;
        this.track = track;
        this.components = [
            new MessageButton().setCustomId("shuffle").setStyle("PRIMARY").setEmoji(CustomEmojiUtils.get("SHUFFLE_BUTTON").identifier),
            new MessageButton().setCustomId("back").setStyle("PRIMARY").setEmoji(CustomEmojiUtils.get("PREVIOUS_BUTTON").identifier),
            new MessageButton().setCustomId("pause").setStyle("PRIMARY").setEmoji(CustomEmojiUtils.get("PAUSE_BUTTON").identifier),
            new MessageButton().setCustomId("next").setStyle("PRIMARY").setEmoji(CustomEmojiUtils.get("NEXT_BUTTON").identifier),
            new MessageButton().setCustomId("loop").setStyle("PRIMARY").setEmoji(CustomEmojiUtils.get(getLoopStateButtonName(this.manager.dispatcher.queue.loopState)).identifier)
        ];
    }

    async send() {
        if (this.message) return this.message;

        const playingEmbed = new MessageEmbed({
            title: `${CustomEmojiUtils.get("MUSICAL_NOTES")} Started playing! ${CustomEmojiUtils.get("ANIMATED_PLAYING")}`,
            description: `**[${DCUtil.escapeMarkdown(this.track.displayTitle)}](${this.track.displayURL})**\n\`Added by - \`${this.track.requester}\` \``,
            image: {
                url: "https://cdn.discordapp.com/attachments/756541902202863740/780739509704327198/1920x1_TP.png"
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

        if (!this.message) return;

        if (this.doNotSend) return this.delete();
    }

    async setPause(value: boolean) {
        this.components[2] = new MessageButton()
            .setCustomId(value ? "resume" : "pause")
            .setStyle("PRIMARY")
            .setEmoji(CustomEmojiUtils.get(value ? "RESUME_BUTTON" : "PAUSE_BUTTON").identifier);

        await this.message?.edit({
            components: [
                {
                    type: 1,
                    components: this.components
                }
            ]
        });
    }

    async setLoopState(value: QueueLoopState) {
        this.components[4] = new MessageButton()
            .setCustomId("loop")
            .setStyle("PRIMARY")
            .setEmoji(CustomEmojiUtils.get(getLoopStateButtonName(value)).identifier);

        await this.message?.edit({
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

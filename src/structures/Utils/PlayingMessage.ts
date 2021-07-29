import { Util as DCUtil, Message, MessageEmbed, MessageButton, InteractionCollector, MessageComponentInteraction } from 'discord.js';
import { ResolvedTrack } from '../Shoukaku/RirichiyoTrack';
import Utils from '../Utils';
import CustomEmojiUtils from './CustomEmojiUtils';
import ThemeUtils from './ThemeUtils';
import PlayingMessageManager from './PlayingMessageManager';
import { QueueLoopState } from '../Shoukaku/Queue';

export default class PlayingMessage {
    // Class props //
    readonly manager: PlayingMessageManager;
    readonly track: ResolvedTrack;
    message?: Message;
    doNotSend: boolean = false;
    components: MessageButton[];
    collector?: InteractionCollector<MessageComponentInteraction>;
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
            thumbnail: {
                url: this.track.displayThumbnail("default")
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

        this.collector = this.message.createMessageComponentCollector({ componentType: "BUTTON", interactionType: "MESSAGE_COMPONENT" })
            .on("collect", async (interaction): Promise<void> => {
                this.manager.dispatcher.client.commandHandler.handleComponentInteraction(interaction, Date.now());
            })

        if (this.doNotSend) return this.delete();
    }

    async setPause(value: boolean, editMessage = true) {
        this.components[2]
            .setCustomId(value ? "resume" : "pause")
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

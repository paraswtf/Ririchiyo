import { Util as DCUtil, Message, MessageEmbed, MessageButton } from 'discord.js';
import { ExtendedShoukakuPlayer } from '../Shoukaku/Dispatcher';
import { ResolvedTrack } from '../Shoukaku/RirichiyoTrack';
import Utils from '../Utils';
import CustomEmojiUtils from './CustomEmojiUtils';
import ThemeUtils from './ThemeUtils';
import PermissionUtils from './PermissionUtils';
import PlayingMessageManager from './PlayingMessageManager';

export default class PlayingMessage {
    // Class props //
    readonly manager: PlayingMessageManager;
    readonly track: ResolvedTrack;
    message?: Message;
    doNotSend: boolean = false;
    components = [
        new MessageButton().setCustomId("shuffle").setStyle("PRIMARY").setEmoji(CustomEmojiUtils.get("shuffle").identifier),
        new MessageButton().setCustomId("back").setStyle("PRIMARY").setEmoji(CustomEmojiUtils.get("previous_track").identifier),
        new MessageButton().setCustomId("pause").setStyle("PRIMARY").setEmoji(CustomEmojiUtils.get("play_or_pause").identifier),
        new MessageButton().setCustomId("next").setStyle("PRIMARY").setEmoji(CustomEmojiUtils.get("next_track").identifier),
        new MessageButton().setCustomId("loop").setStyle("PRIMARY").setEmoji(CustomEmojiUtils.get("loop").identifier)
    ]
    // Class props //

    constructor(manager: PlayingMessageManager, track: ResolvedTrack) {
        this.manager = manager;
        this.track = track;
    }

    async send() {
        if (this.message) return this.message;

        const playingEmbed = new MessageEmbed({
            title: `${CustomEmojiUtils.get("musical_notes")} Started playing! ${CustomEmojiUtils.get("animated_playing")}`,
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
            .setStyle(value ? "SECONDARY" : "PRIMARY")
            .setEmoji(CustomEmojiUtils.get("play_or_pause").identifier);

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

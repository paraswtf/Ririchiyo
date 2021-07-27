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
            color: ThemeUtils.getClientColor(this.manager.dispatcher.guild)
        });

        const permissions = await PermissionUtils.handlePermissionsForChannel(this.manager.dispatcher.textChannel, {
            requiredPermissions: ["USE_EXTERNAL_EMOJIS"],
            channelToSendMessage: this.manager.dispatcher.textChannel
        });

        if (!permissions.hasAll) return;

        /**
        * Send message
        */
        if (this.doNotSend) return;

        const options = {
            embeds: [playingEmbed],
            components: [
                {
                    type: 1,
                    components: [
                        new MessageButton().setCustomId("shuffle").setStyle("PRIMARY").setEmoji(CustomEmojiUtils.get("shuffle").identifier),
                        new MessageButton().setCustomId("back").setStyle("PRIMARY").setEmoji(CustomEmojiUtils.get("previous_track").identifier),
                        new MessageButton().setCustomId("playpause").setStyle("PRIMARY").setEmoji(CustomEmojiUtils.get("play_or_pause").identifier),
                        new MessageButton().setCustomId("next").setStyle("PRIMARY").setEmoji(CustomEmojiUtils.get("next_track").identifier),
                        new MessageButton().setCustomId("loop").setStyle("PRIMARY").setEmoji(CustomEmojiUtils.get("loop").identifier)
                    ]
                }
            ]
        };

        //Checks if this is the first track and replies to the original ctx instead of making a new message
        if (this.manager.dispatcher.firstCtx) {
            this.message = await this.manager.dispatcher.firstCtx.reply(options).catch(Utils.client.logger.error);
            delete this.manager.dispatcher.firstCtx;
        }
        else this.message = await this.manager.dispatcher.textChannel.send(options).catch(Utils.client.logger.error);

        if (!this.message) return;

        if (this.doNotSend) return this.delete();
    }

    delete() {
        if (!this.message) return this.doNotSend = true;
        if (this.message.deletable && !this.message.deleted) this.message.delete().catch(Utils.client.logger.error);
        delete this.message;
    }
}

import BaseEvent from '../../structures/Events/BaseEvent';
import { Util as DCUtil } from 'discord.js';
import { ExtendedShoukakuPlayer } from '../../structures/Shoukaku/Dispatcher';
import { PlayerExceptionEvent as EventData } from 'shoukaku';
import { EmbedUtils } from '../../structures/Utils';

/** 
 * Emitted when the Lavalink Server sends a TrackExceptionEvent, Automatically fires TrackEndEvent so handling this is optional, Optional.
 */
export default class PlayerExceptionEvent extends BaseEvent<ExtendedShoukakuPlayer> {
    constructor() {
        super({
            name: "trackException",
            category: "shoukakuPlayer",
        })
    }

    async run(player: ExtendedShoukakuPlayer, data: EventData) {
        //Delete the playing message for the current track
        if (player.dispatcher.queue.current) {
            player.dispatcher.playingMessages.deleteMessage(player.dispatcher.queue.current.id);

            await player.dispatcher.sendMessage({
                embeds: [
                    EmbedUtils.embedifyString(
                        player.dispatcher.guild,
                        `**[${DCUtil.escapeMarkdown(player.dispatcher.queue.current.displayTitle)}](${player.dispatcher.queue.current.displayURL})**\n\`Added by - \`${player.dispatcher.queue.current.requester}\` \`\nAn error occured while playing track: \`${data?.exception?.message ?? "UNKNOWN_ERROR"}\``,
                        { isError: true }
                    )
                ]
            })
        }

        //checkErrorRatelimit
        if (player.dispatcher.checkErrorRatelimitted(data.exception.severity)) {
            await player.dispatcher.sendMessage({
                embeds: [
                    EmbedUtils.embedifyString(
                        player.dispatcher.guild,
                        `Something went wrong, welp...\nThe player was deleted because of too many errors...\nIf this keeps happening, please contact the developers...`,
                        { isError: true }
                    )
                ]
            })
            await player.dispatcher.client.dispatchers.destroy(player.dispatcher.guild.id);
        }
        //If not ratelimitted
        else {
            player.dispatcher.queue.next(true);

            if (!player.dispatcher.queue.current) player.dispatcher.sendMessage({
                embeds: [
                    EmbedUtils.embedifyString(player.dispatcher.guild, "The player queue has ended.")
                ]
            })
            else await player.dispatcher.play();
        }
    }
}

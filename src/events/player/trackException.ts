import BaseEvent from '../../structures/Events/BaseEvent';
import { Util as DCUtil } from 'discord.js';
import { ExtendedShoukakuPlayer } from '../../structures/Shoukaku/Dispatcher';
import { PlayerExceptionEvent as EventData } from 'shoukaku';
import { EmbedUtils } from '../../structures/Utils';
import { AnyTrack } from '../../structures/Shoukaku/RirichiyoTrack';
//TO DO=> Add recommendations on track error too
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
        const erroredTrack = player.dispatcher.queue.current as AnyTrack;
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
            player.dispatcher.queue.next();
            //If there is current then play.
            if (player.dispatcher.queue.current) await player.dispatcher.play();
            //If none then handle recommendation
            else if (erroredTrack && erroredTrack.identifier) {
                await player.dispatcher.handleRecommendations(erroredTrack.radioURL);
                //If a track was added
                if (player.dispatcher.queue.current) return await player.dispatcher.play();
            }

            //If no track was added at the end
            if (!player.dispatcher.queue.current) player.dispatcher.sendMessage({
                embeds: [
                    EmbedUtils.embedifyString(player.dispatcher.guild, "The player queue has ended.")
                ]
            })
        }
    }
}

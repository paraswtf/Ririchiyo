import BaseEvent from '../../structures/Events/BaseEvent';
import { ExtendedShoukakuPlayer } from '../../structures/Shoukaku/Dispatcher';
import { PlayerEndEvent as EventData } from 'shoukaku';
import { EmbedUtils } from '../../structures/Utils';
import { ResolvedTrack } from '../../structures/Shoukaku/RirichiyoTrack';

/** 
 * Emitted when the Lavalink Server sends a TrackEndEvent or TrackStuckEvent, MUST BE HANDLED.
 */
export default class PlayerEndEvent extends BaseEvent<ExtendedShoukakuPlayer> {
    constructor() {
        super({
            name: "end",
            category: "shoukakuPlayer",
        })
    }

    async run(player: ExtendedShoukakuPlayer, data: EventData) {
        if (player.dispatcher.queue.current) player.dispatcher.playingMessages.deleteMessage(player.dispatcher.queue.current.id);

        switch (data.reason) {
            case "FINISHED": {
                const endedTrack = player.dispatcher.queue.current as ResolvedTrack | undefined;
                player.dispatcher.queue.next();
                //If there is current then play.
                if (player.dispatcher.queue.current) await player.dispatcher.play();
                //If none then handle recommendation
                else if (endedTrack) {
                    await player.dispatcher.handleRecommendations(endedTrack.radioURL);
                    //If a track was added
                    if (player.dispatcher.queue.current) return await player.dispatcher.play();
                }

                //If no track was added at the end
                if (!player.dispatcher.queue.current) player.dispatcher.sendMessage({
                    embeds: [
                        EmbedUtils.embedifyString(player.dispatcher.guild, "The player queue has ended.")
                    ]
                })
                break;
            }
            case "STOPPED": {
                if (!player.dispatcher.queue.current) player.dispatcher.sendMessage({
                    embeds: [
                        EmbedUtils.embedifyString(player.dispatcher.guild, "The player queue has ended.")
                    ]
                })
                break;
            }
        }
    }
}

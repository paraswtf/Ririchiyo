import BaseEvent from '../../structures/Events/BaseEvent';
import { ExtendedShoukakuPlayer } from '../../structures/Shoukaku/Dispatcher';
import { PlayerEndEvent as EventData } from 'shoukaku';

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
        if (data.reason === "FINISHED") {
            player.dispatcher.queue.next();
            await player.dispatcher.play();
        }
    }
}

import BaseEvent from '../../structures/Events/BaseEvent';
import { ExtendedShoukakuPlayer } from '../../structures/Shoukaku/Dispatcher';
import { PlayerExceptionEvent as EventData } from 'shoukaku';

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

    async run(emitter: ExtendedShoukakuPlayer, data: EventData) {
        console.log(this.name);
        console.log(data);
    }
}

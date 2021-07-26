import BaseEvent from '../../structures/Events/BaseEvent';
import { ExtendedShoukakuPlayer } from '../../structures/Shoukaku/Dispatcher';
import { PlayerStartEvent as StartEventData } from 'shoukaku';

/** 
 * Emitted when the Lavalink Server sends a TrackStartEvent, Optional.
 */
export default class PlayerStartEvent extends BaseEvent<ExtendedShoukakuPlayer> {
    constructor() {
        super({
            name: "start",
            category: "shoukakuPlayer",
        })
    }

    async run(player: ExtendedShoukakuPlayer, data: StartEventData) {
        console.log(this.name);
        console.log(data);
    }
}

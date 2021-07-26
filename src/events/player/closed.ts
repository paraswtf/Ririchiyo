import BaseEvent from '../../structures/Events/BaseEvent';
import { ExtendedShoukakuPlayer } from '../../structures/Shoukaku/Dispatcher';
import { PlayerClosedEvent as EventData } from 'shoukaku';

/** 
 * Emitted when the Lavalink Server sends a WebsocketClosedEvent, MUST BE HANDLED.
 */
export default class PlayerClosedEvent extends BaseEvent<ExtendedShoukakuPlayer> {
    constructor() {
        super({
            name: "closed",
            category: "shoukakuPlayer",
        })
    }

    async run(player: ExtendedShoukakuPlayer, data: EventData) {
        console.log(this.name);
        console.log(data);
    }
}

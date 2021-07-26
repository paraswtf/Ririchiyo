import BaseEvent from '../../structures/Events/BaseEvent';
import { ExtendedShoukakuPlayer } from '../../structures/Shoukaku/Dispatcher';

/** 
 * Emitted when this player's node was disconnected, MUST BE HANDLED.
 */
export default class PlayerNodeDisconnectEvent extends BaseEvent<ExtendedShoukakuPlayer> {
    constructor() {
        super({
            name: "nodeDisconnect",
            category: "shoukakuPlayer",
        })
    }

    async run(player: ExtendedShoukakuPlayer, name: string) {
        console.log(this.name);
        console.log(name);
    }
}

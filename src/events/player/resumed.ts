import BaseEvent from '../../structures/Events/BaseEvent';
import { ExtendedShoukakuPlayer } from '../../structures/Shoukaku/Dispatcher';

/** 
 * Emitted when this library managed to resume playing this player, Optional.
 */
export default class PlayerResumedEvent extends BaseEvent<ExtendedShoukakuPlayer> {
    constructor() {
        super({
            name: "resumed",
            category: "shoukakuPlayer",
        })
    }

    async run(player: ExtendedShoukakuPlayer) {
        console.log(this.name);
        console.log("resumed");
    }
}

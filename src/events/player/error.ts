import { ShoukakuError } from 'shoukaku';
import BaseEvent from '../../structures/Events/BaseEvent';
import { ExtendedShoukakuPlayer } from '../../structures/Shoukaku/Dispatcher';

/** 
 * Emitted when this library encounters an internal error in ShoukakuPlayer or ShoukakuLink, MUST BE HANDLED.
 */
export default class PlayerErrorEvent extends BaseEvent<ExtendedShoukakuPlayer> {
    constructor() {
        super({
            name: "error",
            category: "shoukakuPlayer",
        })
    }

    async run(player: ExtendedShoukakuPlayer, error: ShoukakuError | Error) {
        console.log(this.name);
        console.log(error);
    }
}

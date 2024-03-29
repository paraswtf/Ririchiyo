import BaseEvent from '../../structures/Events/BaseEvent';
import { ExtendedShoukakuPlayer } from '../../structures/Shoukaku/Dispatcher';
import { PlayerUpdateEvent as EventData } from 'shoukaku';
import { inspect } from 'util';

/** 
 * Emitted when the Lavalink Server sends a PlayerUpdate OP, Optional.
 */
export default class PlayerUpdateEvent extends BaseEvent<ExtendedShoukakuPlayer> {
    constructor() {
        super({
            name: "playerUpdate",
            category: "shoukakuPlayer",
        })
    }

    async run(player: ExtendedShoukakuPlayer, data: EventData['state']) {
        player.dispatcher.client.logger.debug(this.name);
        player.dispatcher.client.logger.debug(inspect(data));
        player.dispatcher.position = data.position;
    }
}

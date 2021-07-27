import BaseEvent from '../../structures/Events/BaseEvent';
import { ExtendedShoukakuPlayer } from '../../structures/Shoukaku/Dispatcher';
import { PlayerUpdateEvent as EventData } from 'shoukaku';

/** 
 * Custom event, Emitted when the player meets certain inactive conditions for a given time.
 */
export default class PlayerInactivityEvent extends BaseEvent<ExtendedShoukakuPlayer> {
    constructor() {
        super({
            name: "playerInactivity",
            category: "shoukakuPlayer",
        })
    }

    async run(player: ExtendedShoukakuPlayer) {
        await player.dispatcher.client.dispatchers.destroy(player.dispatcher.guild.id);
    }
}

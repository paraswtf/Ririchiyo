import BaseEvent from '../../structures/Events/BaseEvent';
import { ExtendedShoukakuPlayer } from '../../structures/Shoukaku/Dispatcher';
import { PlayerEndEvent as EventData } from 'shoukaku';
import { EmbedUtils } from '../../structures/Utils';

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
                player.dispatcher.queue.next();
                await player.dispatcher.play();
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

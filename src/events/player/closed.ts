import BaseEvent from '../../structures/Events/BaseEvent';
import { ExtendedShoukakuPlayer } from '../../structures/Shoukaku/Dispatcher';
import { PlayerClosedEvent as EventData } from 'shoukaku';
import { EmbedUtils, ThemeUtils } from '../../structures/Utils';
import { player_disconnect_destroy_timeout } from '../../config';

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
        if (player.dispatcher.queue.current && !player.paused) {
            await player.setPaused(true);
            player.dispatcher.playingMessages.deleteMessage(player.dispatcher.queue.current.id);

            //If there is no previous timeout create one
            if (!player.dispatcher.destroyTimeout) {
                player.dispatcher.destroyTimeout = setTimeout(() => {
                    player.dispatcher.client.dispatchers.destroy(player.dispatcher.guild.id);
                    player.dispatcher.sendMessage({
                        embeds: [
                            EmbedUtils.embedifyString(player.dispatcher.guild,
                                "I was disconnected from the voice channel for too long, I've deleted the player.",
                                { embedColour: ThemeUtils.colors.get("warn").rgbNumber() }
                            )
                        ]
                    })
                }, player_disconnect_destroy_timeout);
            }
        }

        await player.dispatcher.sendMessage({
            embeds: [
                EmbedUtils.embedifyString(player.dispatcher.guild,
                    "I got disconnected from the voice channel, and paused the player.",
                    { embedColour: ThemeUtils.colors.get("info").rgbNumber() }
                )
            ]
        })
    }
}

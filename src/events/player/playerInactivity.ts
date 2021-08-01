import BaseEvent from '../../structures/Events/BaseEvent';
import { ExtendedShoukakuPlayer } from '../../structures/Shoukaku/Dispatcher';
import { PlayerUpdateEvent as EventData } from 'shoukaku';
import { EmbedUtils, ThemeUtils } from '../../structures/Utils';
import { premium_uri } from '../../config';

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
        await player.dispatcher.sendMessage({
            embeds: [
                EmbedUtils.embedifyString(
                    player.dispatcher.guild,
                    `I left the voice channel due to inactivity!\nIf you have **[premium](${premium_uri})**, you can disable this by using \`/24x7\``,
                    { embedColour: ThemeUtils.colors.get("warn")!.rgbNumber() }
                )
            ]
        });
        await player.dispatcher.client.dispatchers.destroy(player.dispatcher.guild.id);
    }
}

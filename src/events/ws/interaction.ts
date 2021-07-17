import { WebSocketManager } from 'discord.js';
import BaseEvent from '../../structures/Events/BaseEvent';
import { Logger } from '../../structures/Utils';


export default class SlashCommandEvent extends BaseEvent<ExtendedWebSocketManager> {
    constructor() {
        super({
            name: "INTERACTION_CREATE",
            category: "ws",
        })
    }

    async run(ws: ExtendedWebSocketManager, interactionData: any) {
        //ws.logger.client.commandHandler.handleInteraction(await new Interaction(ws.logger.client, interactionData)._init(), Date.now());
    }
}

export interface ExtendedWebSocketManager extends WebSocketManager {
    logger: Logger;
}

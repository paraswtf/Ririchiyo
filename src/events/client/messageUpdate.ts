import BaseEvent from '../../structures/Events/BaseEvent';
import RirichiyoClient from '../../structures/RirichiyoClient';
import { Message } from 'discord.js';

export default class ClientMessageUpdateEvent extends BaseEvent<RirichiyoClient> {
    constructor() {
        super({
            name: "messageUpdate",
            category: "client",
        })
    }

    async run(client: RirichiyoClient, msg: Message) {
        client.logger.log("edited");
        //Filter unnessacary edit events
        if (msg.author.bot || !msg.previousResponse || msg.previousResponse.responseMessage?.deleted) return;
        this.client.commandHandler.handleMessage(msg, Date.now(), true);
    }
}

export class MessageExtension {
    previousResponse?: PreviousResponse
}

declare module 'discord.js' {
    interface Message extends MessageExtension { }
}

export interface PreviousResponse {
    responseMessage?: Message
}

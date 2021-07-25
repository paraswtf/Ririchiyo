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

    async run(emitter: RirichiyoClient, _: Message, msg: Message) {
        //Filter unnessacary edit events
        if (msg.author.bot || !msg.previousCommandResponse || msg.previousCommandResponse.responseMessage?.deleted) return;
        this.emitter.commandHandler.handleMessage(msg, Date.now(), true);
    }
}

import BaseEvent from '../../structures/Events/BaseEvent';
import RirichiyoClient from '../../structures/RirichiyoClient';
import { Message } from 'discord.js';

export default class ClientMessageCreateEvent extends BaseEvent<RirichiyoClient> {
    constructor() {
        super({
            name: "messageCreate",
            category: "client",
        })
    }

    async run(emitter: RirichiyoClient, msg: Message) {
        if (!msg.author.bot) this.emitter.commandHandler.handleMessage(msg, Date.now());
    }
}

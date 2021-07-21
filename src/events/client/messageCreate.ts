import path from 'path';
import BaseEvent from '../../structures/Events/BaseEvent';
import Client from '../../structures/Client';
import Utils from '../../structures/Utils';
import { Message } from 'discord.js';

export default class ClientMessageCreateEvent extends BaseEvent<Client> {
    constructor() {
        super({
            name: "messageCreate",
            category: "client",
        })
    }

    async run(client: Client, msg: Message) {
        if (!msg.author.bot) this.client.commandHandler.handleMessage(msg, Date.now());
    }
}

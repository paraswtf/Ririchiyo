import { Client as DiscordClient, ClientOptions, GuildResolvable, WebSocketManager } from 'discord.js';
import { Utils, Logger } from './Utils';
import Events from './Events/Events';
import Commands from './Commands/Commands';
import { CommandHandler } from './Commands/CommandHandler';
import DB from '../structures/Data/Database';
import path from 'path';
import Manager from './Lavalink/LavalinkClient';

import { discord, database, lavalinkOptions } from '../config';

export class Client extends DiscordClient {
    logger: Logger;
    db: DB;
    events: Events<this>;
    commands: Commands;
    commandHandler: CommandHandler;
    lavalink: Manager;

    constructor(options: ClientOptions) {
        super(options);
        Utils._init(this);
        this.logger = new Logger(this);
        this.db = new DB(database.uri, this);
        this.lavalink = new Manager(Object.assign({ client: this }, lavalinkOptions));
        //Add logger to ws and load ws events
        Object.assign(
            { events: new Events(null, Object.assign(this.ws, { logger: this.logger })).load(path.join(__dirname, "../events/ws")) }
        );
        this.events = new Events(null, this).load(path.join(__dirname, "../events/client"));
        this.commands = new Commands(null, this);
        this.commandHandler = new CommandHandler(this);
    }

    async login(token = this.token): Promise<string> {
        if (!token || typeof token !== 'string') throw new Error('TOKEN_INVALID');
        await this.preLogin();
        const res = await super.login(token);
        await this.postLogin();
        return res;
    }

    async preLogin() {
    }

    async postLogin() {
    }

    /** Send data function for lavalink */
    private send(id: GuildResolvable, payload: any) {
        this.guilds.resolve(id)?.shard.send(payload);
    }
}

export interface ExtendedWebSocketManager extends WebSocketManager {
    logger: Logger;
}

export default Client;

import { Client as DiscordClient, ClientOptions, ClientUser, GuildResolvable, ShardClientUtil } from 'discord.js';
import { Utils, Logger } from './Utils';
import Events from './Events/Events';
import Commands from './Commands/Commands';
import { CommandHandler } from './Commands/CommandHandler';
import DB from './Data/Database';
import path from 'path';
import Shoukaku from './Shoukaku';

import { mongodb, shoukakuNodes, shoukakuOptions, youtube } from '../config';
import { DispatcherManager } from './Shoukaku/Dispatcher';
import { YouTube } from './YouTube';

export class RirichiyoClient extends DiscordClient {
    logger: Logger;
    db: DB;
    events: Events<this>;
    commands: Commands;
    commandHandler: CommandHandler;
    shoukaku: Shoukaku;
    ytAPI: YouTube;
    dispatchers: DispatcherManager;
    user!: ClientUser;
    shard!: ShardClientUtil;

    constructor(options: ClientOptions) {
        super(options);
        Utils._init(this);
        this.logger = new Logger(this);
        this.db = new DB({ mongoDBURI: mongodb.uri }, this);
        this.shoukaku = new Shoukaku(this, shoukakuNodes, shoukakuOptions);
        this.ytAPI = new YouTube(youtube.APIKey, { cache: true, fetchAll: false });
        this.dispatchers = new DispatcherManager();
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

export default RirichiyoClient;

import { Client as DiscordClient, ClientOptions, ClientUser, GuildResolvable, ShardClientUtil } from 'discord.js';
import { Utils, Logger, CustomError } from './Utils';
import Events from './Events/Events';
import Commands from './Commands/Commands';
import { CommandHandler } from './Commands/CommandHandler';
import DB from './Data/Database';
import path from 'path';
import Shoukaku from './Shoukaku';

import { ksoft, mongodb, shoukakuNodes, shoukakuOptions, spotify, youtube } from '../config';
import { DispatcherManager } from './Shoukaku/Dispatcher';
import { SearchResolver } from './Shoukaku/SearchResolver';
import RirichiyoAPI from './RirichiyoAPI/RirichiyoAPI';

export class RirichiyoClient extends DiscordClient {
    readonly logger: Logger;
    readonly db: DB;
    //readonly rapi: RirichiyoAPI;
    readonly events: Events<this>;
    readonly commands: Commands;
    readonly commandHandler: CommandHandler;
    readonly shoukaku: Shoukaku;
    readonly searchResolver: SearchResolver;
    readonly dispatchers: DispatcherManager;
    readonly user!: ClientUser;
    readonly shard!: ShardClientUtil;

    constructor(options: ClientOptions) {
        super(options);
        Utils._init(this);
        this.logger = new Logger(this);
        this.db = new DB({ mongoDBURI: mongodb.uri }, this);
        // this.rapi = new RirichiyoAPI(this, {
        //     retryAmount: Infinity,
        //     retryDelay: 5e3,
        //     appID: "ADMIN",
        //     secure: true
        // });
        if (!shoukakuNodes) throw new CustomError('No options provided for node config');
        this.shoukaku = new Shoukaku(this, shoukakuNodes, shoukakuOptions);
        this.searchResolver = new SearchResolver({ youtubeKey: youtube.APIKey, spotify, ksoftToken: ksoft.token });
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
        //this.rapi.connect("612f1cca-0cc9-4e96-8627-66442cded569");
    }
}

export default RirichiyoClient;

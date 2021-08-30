import {
    Collection,
    Guild as DiscordGuild,
    User as DiscordUser
} from 'discord.js';
import {
    Db as DBConnection,
    MongoClient,
    MongoClientOptions,
    Collection as DBCollection
} from 'mongodb';
import RirichiyoClient from '../RirichiyoClient';
import {
    Guild,
    GuildData,
    defaultGuildData
} from './classes/Guild';
import {
    User,
    UserData
} from './classes/User';

export class DB {
    // Class props //
    client: RirichiyoClient;
    mongoClient: MongoClient;
    connection?: DBConnection;
    cache: Cache;
    collections!: Collections;
    // Class props //

    constructor(uriOptions: DBURIOptions, client: RirichiyoClient, options: MongoClientOptions = {}) {
        this.client = client;
        this.mongoClient = new MongoClient(uriOptions.mongoDBURI, Object.assign({ useUnifiedTopology: true }, options));
        this.cache = {
            guilds: new Collection(),
            users: new Collection()
        }
    }

    async connect(): Promise<DBConnection> {
        try {
            await this.mongoClient.connect();
            const connection = this.mongoClient.db();
            this.collections = {
                guilds: connection.collection(`guilds`),
                users: connection.collection(`users`)
            };
            this.connection = connection;
            this.client.logger.info(`Database connected: ${connection.databaseName}`);

            return connection;
        } catch {
            throw new Error("Could not connect to the database");
        }
    }

    getDefaultGuild(): Guild {
        //if no cached instance exists create one
        if (!this.cache.guilds.has("default")) this.cache.guilds.set("default", new Guild(this, null, defaultGuildData));
        return this.cache.guilds.get("default")!;
    }

    async getGuild(guild: DiscordGuild | null = null): Promise<Guild> {
        if (!guild) return this.getDefaultGuild();
        //if no cached instance exists create one
        if (!this.cache.guilds.has(guild.id)) this.cache.guilds.set(guild.id,
            new Guild(
                this,
                guild,
                await this.collections.guilds.findOne({ _id: guild.id }) || { _id: guild.id }
            )
        );

        return this.cache.guilds.get(guild.id)!;
    }

    async getUser(user: DiscordUser): Promise<User> {
        //if no cached instance exists create one
        if (!this.cache.users.has(user.id)) this.cache.users.set(user.id,
            new User(
                this,
                user,
                await this.collections.users.findOne({ _id: user.id }) || { _id: user.id }
            )
        );

        return this.cache.users.get(user.id)!;
    }
}

export interface Collections {
    guilds: DBCollection<GuildData>,
    users: DBCollection<UserData>
}

export interface Cache {
    guilds: Collection<Guild['id'], Guild>
    users: Collection<User['id'], User>
}

export interface DBURIOptions {
    mongoDBURI: string
}

export default DB;

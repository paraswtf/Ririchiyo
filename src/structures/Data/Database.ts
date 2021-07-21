import { Collection } from 'discord.js';
import {
    Db as DBConnection,
    MongoClient,
    MongoClientOptions,
    Collection as DBCollection
} from 'mongodb';
import Client from '../Client';
import {
    Guild,
    GuildData,
    defaultGuildData
} from './classes/Guild';

import {
    Guild as DiscordGuild
} from 'discord.js';

export class DB {
    // Class props //
    client: Client;
    mongoClient: MongoClient;
    connection?: DBConnection;
    cache: Cache;
    collections!: Collections;
    // Class props //

    constructor(uriOptions: DBURIOptions, client: Client, options: MongoClientOptions = {}) {
        this.client = client;
        this.mongoClient = new MongoClient(uriOptions.mongoDBURI, Object.assign({ useUnifiedTopology: true }, options));
        this.cache = {
            guilds: new Collection()
        }
    }

    async connect(): Promise<DBConnection> {
        try {
            await this.mongoClient.connect();
            const connection = this.mongoClient.db();
            this.collections = {
                guilds: connection.collection(`guilds`)
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
}

export interface Collections {
    guilds: DBCollection<GuildData>
}

export interface Cache {
    guilds: Collection<Guild['id'], Guild>
}

export interface DBURIOptions {
    mongoDBURI: string
}

export default DB;

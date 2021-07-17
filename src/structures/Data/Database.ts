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
    GuildData
} from './classes/Guild';

export class DB {
    // Class props //
    client: Client;
    mongoClient: MongoClient;
    connection?: DBConnection;
    cache: Cache;
    collections!: Collections;
    // Class props //

    constructor(uri: string, client: Client, options: MongoClientOptions = {}) {
        if (!uri) throw new TypeError("No uri provided to connect.");
        this.mongoClient = new MongoClient(uri, Object.assign({ useUnifiedTopology: true }, options));
        this.client = client;
        this.cache = {
            guilds: new Collection()
        }
    }

    async connect(databaseName: string): Promise<DBConnection> {
        try {
            await this.mongoClient.connect();
            const connection = this.mongoClient.db(databaseName);
            this.collections = {
                guilds: connection.collection(`guilds`)
            };
            this.connection = connection;
            this.client.logger.info(`Database connected: ${databaseName}`);

            return connection;
        } catch {
            throw new Error("Could not connect to the database");
        }
    }

    async getGuild(id: string): Promise<Guild> {
        //if no cached instance exists create one
        if (!this.cache.guilds.has(id)) this.cache.guilds.set(id,
            new Guild(this,
                await this.collections.guilds.findOne({ _id: id }) || { _id: id }
            )
        );

        return this.cache.guilds.get(id)!;
    }
}

export interface Collections {
    guilds: DBCollection<GuildData>
}

export interface Cache {
    guilds: Collection<Guild['id'], Guild>
}

export default DB;

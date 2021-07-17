import 'source-map-support/register';
//import { ShardingManager } from 'kurasuta';
import Client from '../structures/Client';
import { join } from 'path';
import { shardingManagerOptions } from '../config';
import { ShardingManager } from 'discord.js';

// const sharder = new ShardingManager(
//     join(__dirname, '../utils/structures/Cluster'),
//     Object.assign(shardingManagerOptions, { client: Client })
// );

const sharder = new ShardingManager('./src/main/bot.js');

sharder.spawn();

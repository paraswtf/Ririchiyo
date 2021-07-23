import 'source-map-support/register';
import { ShardingManager } from '../structures/Sharder';
import RirichiyoClient from '../structures/RirichiyoClient';
import { join } from 'path';
import { shardingManagerOptions } from '../config';
//import { ShardingManager } from 'discord.js';

const sharder = new ShardingManager(
    join(__dirname, '../structures/Cluster'),
    Object.assign(shardingManagerOptions, { client: RirichiyoClient })
);

//const sharder = new ShardingManager('./src/main/bot.js');

sharder.spawn();

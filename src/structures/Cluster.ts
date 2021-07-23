import { BaseCluster, ShardingManager } from './Sharder';
import Client from './Client';
import { discord } from '../config';

export abstract class CustomBaseCluster extends BaseCluster {
    client!: Client;
}

export class Cluster extends CustomBaseCluster {
    constructor(manager: ShardingManager) {
        super(manager);
    }

    launch() {
        this.client.login(discord.token);
    }
}

export default Cluster;

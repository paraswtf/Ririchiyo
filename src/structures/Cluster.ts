import { BaseCluster, ShardingManager } from './Sharder';
import RirichiyoClient from './RirichiyoClient';
import { discord } from '../config';

export abstract class CustomBaseCluster extends BaseCluster {
    client!: RirichiyoClient;
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

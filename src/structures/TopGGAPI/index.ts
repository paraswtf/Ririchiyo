import Axios, { AxiosInstance } from "axios";
import RirichiyoClient from "../RirichiyoClient";

class Topgg {
    readonly api: AxiosInstance;
    readonly client: RirichiyoClient;
    constructor(client: RirichiyoClient, token: string) {
        this.client = client;
        this.api = Axios.create({
            baseURL: `https://top.gg/api/bots/${this.client.user.id}`,
            headers: { Authorization: token }
        })
        this.client = client;
    }

    async postStats(stats: TopGGStats) {
        const result = await this.api.post('/stats', stats);
        return result.data;
    }

    async hasVoted(userId: string) {
        const result = await this.api.get('/check', { params: { userId } });
        return !!result.data.voted;
    }
}

export interface TopGGStats {
    server_count: number;
    shards?: number[]
    shard_id?: number;
    shard_count?: number;
}

export default Topgg;

import Client from "../structures/Client";
import { ManagerOptions } from "../structures/Lavalink/LavalinkClient";
import credentials from "./credentials";

export const lavalinkOptions: Partial<ManagerOptions> = {};

export const owners = [
    {
        name: "ParasDeshpande",
        id: "429035988732346368",
        github: "https://github.com/Styxo",
        contact: "parasbpndeshpande@gmail.com",
        profileURL: "https://dsc.bio/styxo"
    }
];

export const shardingManagerOptions = {
    token: credentials.discord.token,
    shardCount: 1,
    clusterCount: 1,
    client: Client,
    clientOptions: {}
}

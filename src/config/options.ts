import Client from "../structures/Client";
import { ShoukakuNodeOptions, ShoukakuOptions } from "shoukaku";
import credentials from "./credentials";

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

export const shoukakuNodes: ShoukakuNodeOptions[] = [
    {
        name: 'Local',
        host: 'localhost',
        port: 7001,
        auth: 'youshallnotpass',
    }
]

export const shoukakuOptions: ShoukakuOptions = {};

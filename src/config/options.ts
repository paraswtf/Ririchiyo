import Client from "../structures/Client";
import { ShoukakuNodeOptions, ShoukakuOptions } from "shoukaku";
import credentials from "./credentials";
import { SharderOptions } from "../structures/Sharder";
import { InviteGenerationOptions } from "discord.js";
import { CustomEmojiName } from "./customEmojis";

export const owners: OwnerObject[] = [
    {
        name: "ParasDeshpande",
        id: "429035988732346368",
        displayName: "Styxo",
        github: "https://github.com/Styxo",
        contact: "parasbpndeshpande@gmail.com",
        profileURL: "https://dsc.bio/styxo",
        clickableLink: "https://dsc.bio/styxo"
    }
];

export const clientOptions: Client['options'] = {
    intents: [
        "GUILDS",
        "GUILD_VOICE_STATES",
        "GUILD_MESSAGES",
        "DIRECT_MESSAGES",
        "GUILD_MESSAGE_REACTIONS",
        "DIRECT_MESSAGE_REACTIONS"
    ],
    presence: {
        activities: [
            {
                type: 1,
                name: "How to Human..."
            }
        ]
    }
}

export const shardingManagerOptions: SharderOptions = {
    token: credentials.discord.token,
    shardCount: 4,
    clusterCount: 2,
    client: Client,
    clientOptions
}

export const shoukakuNodes: ShoukakuNodeOptions[] = [
    {
        name: 'Local',
        host: 'localhost',
        port: 7001,
        auth: 'youshallnotpass',
    }
]

export const inviteGenerateOptions: InviteGenerationOptions = { permissions: 2192960584n, scopes: ["bot", "applications.commands"] };
export const redirect_uri = "";

export const shoukakuOptions: ShoukakuOptions = {};

export interface OwnerObject {
    name: string,
    id: `${bigint}`,
    displayName: string,
    github: string,
    contact: string,
    profileURL: string,
    clickableLink: string,
    emoji?: CustomEmojiName,
}

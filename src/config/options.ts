import Client from "../structures/RirichiyoClient";
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
        clickableLink: "https://dsc.bio/styxo",
        emoji: "PANDA_CODING_ANIMATED"
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
                type: 0,
                name: "Starting big-brain.exe"
            }
        ]
    }
}

export const shardingManagerOptions: SharderOptions = {
    token: credentials.discord.token,
    shardCount: 4,
    clusterCount: 2,
    client: Client,
    clientOptions,
    ipcSocket: process.env.ENVIORNMENT === "DEVELOPMENT" ? 8888 : 9999
}

export const shoukakuNodes: ShoukakuNodeOptions[] = [
    {
        name: 'DEV',
        host: 'localhost',
        port: 9000,
        auth: 'youshallnotpassdev',
    }
]

export const inviteGenerateOptions: InviteGenerationOptions = { permissions: 2192960584n, scopes: ["bot", "applications.commands"] };
export const support_server_url = "";
export const redirect_uri = "";
export const premium_uri = "";
export const message_delete_timeout = 6000;
export const player_inactivity_timeout = 300000;
export const player_disconnect_destroy_timeout = 150000;

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

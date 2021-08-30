import { ShoukakuNodeOptions } from "shoukaku";

export const env = process.env.NODE_ENV as EnvType;
export const isProduction = env === 'production';
export const isDevelopment = !isProduction;

export const discord: DiscordCredentials = {
    token: process.env.DISCORD_TOKEN as string
} as const

export const mongodb: MongoDBCredentials = {
    uri: process.env.MONGODB_URI as string
} as const

export const youtube: YouTubeCredentials = {
    APIKey: process.env.YOUTUBE_API_KEY as string
} as const

export const spotify: SpotifyCredentials = {
    clientID: process.env.SPOTIFY_CLIENT_ID as string,
    secret: process.env.SPOTIFY_CLIENT_SECRET as string,
}

export const ksoft: KSoftCredentials = {
    token: process.env.KSOFT_API_TOKEN as string
} as const

export const topgg: TopGGCredentials = {
    token: process.env.TOPGG_API_TOKEN as string
} as const
export const ririchiyoAPI: RirichiyoAPICredentials = {
    token: process.env.RIRICHIYO_API_TOKEN as string
} as const
export const shoukakuNodes: ShoukakuNodeOptions[] | undefined = typeof process.env.LAVALINK_NODES === "string" ?
    JSON.parse(process.env.LAVALINK_NODES) :
    process.env.LAVALINK_NODES;

export default { discord, mongodb, youtube, spotify, ksoft };

export type EnvType =
    | 'production'
    | 'development'
export interface DiscordCredentials {
    readonly token: string
}
export interface MongoDBCredentials {
    readonly uri: string
}
export interface YouTubeCredentials {
    readonly APIKey: string
}
export interface SpotifyCredentials {
    readonly clientID: string,
    readonly secret: string
}
export interface KSoftCredentials {
    readonly token: string
}
export interface TopGGCredentials {
    readonly token: string
}
export interface RirichiyoAPICredentials {
    readonly token: string
}

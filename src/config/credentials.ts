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

export default { discord, mongodb, youtube, spotify };

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

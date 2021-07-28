export const discord: DiscordCredentials = {
    token: process.env.DISCORD_TOKEN as string
} as const

export const mongodb: MongoDBCredentials = {
    uri: process.env.MONGODB_URI as string
} as const

export const youtube: YouTubeDBCredentials = {
    APIKey: process.env.YOUTUBE_API_KEY as string
} as const

export default { discord, mongodb, youtube };

export interface DiscordCredentials {
    readonly token: string
}
export interface MongoDBCredentials {
    readonly uri: string
}
export interface YouTubeDBCredentials {
    readonly APIKey: string
}

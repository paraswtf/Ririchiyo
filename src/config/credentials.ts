export const discord: DiscordCredentials = {
    token: process.env.DISCORD_TOKEN as string
} as const

export const mongodb: MongoDBCredentials = {
    uri: process.env.MONGODB_URI as string
} as const

export const redis: RedisCredentials = {
    uri: process.env.REDIS_URI as string,
} as const

export default { discord, mongodb, redis };

export interface DiscordCredentials {
    readonly token: string
}
export interface MongoDBCredentials {
    readonly uri: string
}
export interface RedisCredentials {
    readonly uri: string
}

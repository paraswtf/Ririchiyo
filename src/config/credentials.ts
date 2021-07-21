export const discord: DiscordCredentials = {
    token: process.env.DISCORD_TOKEN as string
} as const

export const mongodb: MongoDBCredentials = {
    uri: process.env.MONGODB_URI as string
} as const

export default { discord, mongodb };

export interface DiscordCredentials {
    readonly token: string
}
export interface MongoDBCredentials {
    readonly uri: string
}

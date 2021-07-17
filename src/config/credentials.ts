export const discord = {
    token: process.env.DISCORD_TOKEN as string
}

export const database = {
    uri: process.env.DATABASE_URI as string,
    name: process.env.DATABASE_NAME as string,
}

export default { discord, database };

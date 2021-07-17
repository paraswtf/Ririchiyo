import credentials from "../config/credentials";
import Client from "../structures/Client";
const client = new Client({
    intents: ["DIRECT_MESSAGES", "GUILDS", "GUILD_MESSAGES", "GUILD_WEBHOOKS", "GUILD_INTEGRATIONS"]
});

client.login(credentials.discord.token);

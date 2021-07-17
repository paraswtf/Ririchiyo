import merge from 'deepmerge';
import Guild from "./Guild";

export const defaultData = [
    {
        clientId: undefined,
        prefix: "r!"
    }
]

export class GuildSettings {
    // Class props //
    readonly guild: Guild;
    readonly clientId: string;
    readonly data: GuildSettingsData;
    readonly query: QueryToSettings;
    // Class props //

    constructor(guild: Guild, clientId: string) {
        this.guild = guild;
        this.clientId = clientId;
        this.data = merge(this.defaultData, this.guild.data.settings.find(d => d.clientId === clientId) || { clientId });
        this.query = {
            "_id": this.guild.id,
            "premium.settings.clientId": this.clientId
        };
    }

    private get defaultData() {
        return defaultData.find(d => d.clientId === this.clientId) || defaultData[0];
    }

    get prefix() {
        return this.data.prefix;
    }

    async setPrefix(newPrefix?: string) {
        if (this.data.prefix === newPrefix) return this.data.prefix;

        await this.guild.DB.collections.guilds.updateOne(this.query, {
            $set: {
                "settings.$.prefix": this.data.prefix
            }
        });
        this.data.prefix = newPrefix || this.defaultData.prefix;
        this.guild.data.settings[this.guild.data.settings.findIndex(d => d.clientId === this.clientId)].prefix = this.data.prefix;
        return this.prefix;
    }
}

export type QueryToSettings = { "_id": string, "premium.settings.clientId": string };

export interface GuildSettingsData {
    clientId: string,
    prefix: string
}

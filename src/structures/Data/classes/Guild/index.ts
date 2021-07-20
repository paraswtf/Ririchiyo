import DB from '../../Database';
import merge from 'deepmerge';
import {
    GuildPremium,
    GuildPremiumData,
    defaultGuildPremiumData
} from './premium';
import {
    GuildSettingsManager,
    GuildSettingsCollectionData,
    defaultGuildSettingsData
} from './settings';
import { Guild as DiscordGuild } from 'discord.js';

export const defaultGuildData = {
    _id: "default",
    premium: defaultGuildPremiumData,
    settings: defaultGuildSettingsData
}

/**
 * Main global guild data
 */
export class Guild {
    // Class props //
    readonly db: DB;
    readonly dbPath: string;
    readonly query: GuildQuery;
    readonly data: GuildData;
    readonly discordGuild: DiscordGuild | null;
    readonly id: string;
    readonly premium: GuildPremium;
    readonly settings: GuildSettingsManager;
    // Class props //

    constructor(db: DB, discordGuild: DiscordGuild | null, data: Partial<GuildData>) {
        this.db = db;
        this.discordGuild = discordGuild;
        this.dbPath = "";
        this.data = merge(defaultGuildData, data);
        this.query = { _id: this.data._id };
        this.id = this.data._id;
        this.premium = new GuildPremium(this);
        this.settings = new GuildSettingsManager(null, this);
    }
}

export interface GuildData {
    _id: string,
    premium: GuildPremiumData,
    settings: GuildSettingsCollectionData
}

export interface GuildQuery {
    _id: string
};

export default Guild;

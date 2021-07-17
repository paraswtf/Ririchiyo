import DB from '../Database';
import merge from 'deepmerge';
import {
    GuildPremium,
    GuildPremiumData,
    defaultData as defaultGuildPremiumData
} from './GuildPremium';
import {
    GuildSettingsCollection,
    GuildSettingsCollectionData,
    defaultData as defaultGuildSettingsData
} from './GuildSettingsCollection';

export const defaultData = {
    _id: undefined,
    premium: defaultGuildPremiumData,
    settings: defaultGuildSettingsData
}

/**
 * Main global guild data
 */
export class Guild {
    // Class props //
    readonly DB: DB;
    readonly data: GuildData;
    readonly id: string;
    readonly premium: GuildPremium;
    readonly settings: GuildSettingsCollection;
    // Class props //

    constructor(DB: DB, data: Partial<GuildData>) {
        this.DB = DB;
        this.data = merge(defaultData, data);
        this.id = this.data._id;
        this.premium = new GuildPremium(this);
        this.settings = new GuildSettingsCollection(null, this);
    }
}

export interface GuildData {
    _id: string,
    premium: GuildPremiumData,
    settings: GuildSettingsCollectionData
}

export default Guild;

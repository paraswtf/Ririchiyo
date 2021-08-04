import { Collection } from "discord.js";
import Guild from "..";
import { GuildSettings, GuildSettingsData } from "./GuildSettings";
import DBUtils from "../../../DBUtils";

//Main Ririchiyo
const client_831406931205292053: GuildSettingsData = {
    languagePreference: 'EN',
    permissions: {
        members: {},
        roles: {}
    }
}

//Ririchiyo Staging
const client_870271857218158612: GuildSettingsData = {
    languagePreference: 'EN',
    permissions: {
        members: {},
        roles: {}
    }
}

//Ririchiyo Development
const client_870271951128645664: GuildSettingsData = {
    languagePreference: 'EN',
    permissions: {
        members: {},
        roles: {}
    }
}

export const defaultGuildSettingsData = {
    "831406931205292053": client_831406931205292053,
    "870271857218158612": client_870271857218158612,
    "870271951128645664": client_870271951128645664
};

export type GuildSettingsCollectionData = typeof defaultGuildSettingsData;
export type AllowedClientID = keyof GuildSettingsCollectionData;

export class GuildSettingsManager extends Collection<string, GuildSettings> {
    // Class props //
    readonly guild!: Guild;
    readonly dbPath!: string;
    // Class props //

    constructor(entries?: readonly ([string, GuildSettings])[] | null, guild?: Guild) {
        super(entries);
        if (guild) {
            this.guild = guild;
            this.dbPath = DBUtils.join(guild.dbPath, "settings");
        }
    }

    getSettings(clientId: AllowedClientID = this.guild.db.client.user!.id as AllowedClientID) {
        //if no cached instance exists create one
        if (!super.has(clientId)) super.set(clientId, new GuildSettings(this, clientId));
        return super.get(clientId)!;
    }
}


//Export basically everything
export * from './GuildSettings';

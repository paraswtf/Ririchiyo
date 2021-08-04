import { Collection } from "discord.js";
import Guild from "..";
import { GuildSettings, GuildSettingsData } from "./GuildSettings";
import DBUtils from "../../../DBUtils";

export const defaultGuildSettingsData = {
    //Ririchiyo
    "831406931205292053": {
        languagePreference: 'EN',
        permissions: {
            members: {},
            roles: {}
        }
    } as GuildSettingsData,
    //Ririchiyo 2
    "870270773019947069": {
        languagePreference: 'EN',
        permissions: {
            members: {},
            roles: {}
        }
    } as GuildSettingsData,
    //Ririchiyo 3
    "870271367940046848": {
        languagePreference: 'EN',
        permissions: {
            members: {},
            roles: {}
        }
    } as GuildSettingsData,
    //Ririchiyo Beta
    "870271619896049754": {
        languagePreference: 'EN',
        permissions: {
            members: {},
            roles: {}
        }
    } as GuildSettingsData,
    //Ririchiyo Staging
    "870271857218158612": {
        languagePreference: 'EN',
        permissions: {
            members: {},
            roles: {}
        }
    } as GuildSettingsData,
    //Ririchiyo Development
    "870271951128645664": {
        languagePreference: 'EN',
        permissions: {
            members: {},
            roles: {}
        }
    } as GuildSettingsData
}

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

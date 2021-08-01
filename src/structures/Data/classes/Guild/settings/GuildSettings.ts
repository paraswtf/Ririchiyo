import { Guild } from "..";
import { AllowedClientID, defaultGuildSettingsData, GuildSettingsManager } from ".";
import { GuildPermissionsManager, GuildPermissionsData } from "./permissions";
import DBUtils, { BaseData } from "../../../DBUtils";
import { GuildMember, Role } from "discord.js";
import { GuildMusicSettings } from "./music";
import { LanguageName } from "../../../../../config/translations";

export class GuildSettings extends BaseData {
    // Class props //
    readonly guild: Guild;
    readonly manager: GuildSettingsManager;
    readonly clientId: AllowedClientID;
    readonly dbPath: string;
    // Class props //
    // SubClasses //
    readonly permissions: {
        members: GuildPermissionsManager<GuildMember>,
        roles: GuildPermissionsManager<Role>
    };
    readonly music: GuildMusicSettings;
    // SubClasses //

    constructor(manager: GuildSettingsManager, clientId: AllowedClientID) {
        super();
        this.manager = manager;
        this.guild = this.manager.guild;
        this.clientId = clientId;
        this.dbPath = DBUtils.join(this.manager.dbPath, this.clientId);
        this.permissions = {
            members: new GuildPermissionsManager(this, "members"),
            roles: new GuildPermissionsManager(this, "roles")
        };
        this.music = new GuildMusicSettings(this);
    }

    get languagePreference() {
        return this.getCache("languagePreference", defaultGuildSettingsData[this.clientId].languagePreference);
    }

    async setLanguagePreference(newLanguagePreference?: LanguageName) {
        if (this.languagePreference === newLanguagePreference) return this.languagePreference;
        if (!newLanguagePreference) newLanguagePreference = defaultGuildSettingsData[this.clientId].languagePreference;

        await this.updateDB("languagePreference", newLanguagePreference, newLanguagePreference === defaultGuildSettingsData[this.clientId].languagePreference ? "$unset" : "$set");
        this.updateCache("languagePreference", newLanguagePreference);
        return this;
    }
}

export interface GuildSettingsData {
    languagePreference: LanguageName,
    permissions: {
        members: GuildPermissionsData,
        roles: GuildPermissionsData
    }
}

export default GuildSettings;

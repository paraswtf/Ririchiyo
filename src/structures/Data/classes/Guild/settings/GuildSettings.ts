import { Guild } from "..";
import { AllowedClientID, defaultGuildSettingsData, GuildSettingsManager } from ".";
import { GuildPermissionsManager, GuildPermissionsData } from "./permissions";
import DBUtils, { BaseData } from "../../../DBUtils";
import { GuildMember, Role } from "discord.js";
import { GuildMusicSettings } from "./music";

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

    get prefix() {
        return this.getCache("prefix", defaultGuildSettingsData[this.clientId].prefix);
    }

    async setPrefix(newPrefix?: string) {
        if (this.prefix === newPrefix) return this.prefix;
        if (!newPrefix) newPrefix = defaultGuildSettingsData[this.clientId].prefix;

        await this.updateDB("prefix", null, '$unset');
        this.updateCache("prefix", newPrefix);
        return this;
    }
}

export interface GuildSettingsData {
    prefix: string,
    permissions: {
        members: GuildPermissionsData,
        roles: GuildPermissionsData
    }
}

export default GuildSettings;

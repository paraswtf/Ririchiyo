import { Guild } from "..";
import { UpdateQuery } from 'mongodb';
import { AllowedClientID, defaultGuildSettingsData, GuildSettingsManager } from ".";
import { GuildPermissionsManager, GuildPermissionsData } from "./permissions";
import DBUtils from "../../../DBUtils";
import { GuildMember, Role } from "discord.js";

export class GuildSettings {
    // Class props //
    readonly guild: Guild;
    readonly manager: GuildSettingsManager;
    readonly clientId: AllowedClientID;
    readonly dbPath: string;
    // Class props //
    // SubClasses //
    readonly permissions: {
        members: GuildPermissionsManager<"members", GuildMember>,
        roles: GuildPermissionsManager<"roles", Role>
    };
    // SubClasses //

    constructor(manager: GuildSettingsManager, clientId: AllowedClientID) {
        this.manager = manager;
        this.guild = this.manager.guild;
        this.clientId = clientId;
        this.dbPath = DBUtils.join(this.manager.dbPath, this.clientId);
        this.permissions = {
            members: new GuildPermissionsManager(this, "members"),
            roles: new GuildPermissionsManager(this, "roles")
        }
    }

    private async updateDB(path: string, value: any, op: keyof UpdateQuery<GuildSettingsData> = "$set") {
        return await this.guild.db.collections.guilds.updateOne(this.guild.query, {
            [op]: { [DBUtils.join(this.dbPath, path)]: value }
        }, { upsert: true });
    }

    get prefix() {
        return this.guild.data.settings[this.clientId].prefix;
    }

    async setPrefix(newPrefix?: string) {
        if (this.prefix === newPrefix) return this.prefix;
        if (!newPrefix) newPrefix = defaultGuildSettingsData[this.clientId].prefix;

        await this.updateDB("prefix", newPrefix);
        return this.guild.data.settings[this.clientId].prefix = newPrefix;
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

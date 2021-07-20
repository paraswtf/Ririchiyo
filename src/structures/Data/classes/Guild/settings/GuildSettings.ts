import { Guild } from "..";
import { UpdateQuery } from 'mongodb';
import { AllowedClientID, defaultGuildSettingsData, GuildSettingsManager } from ".";
import { GuildPermissionsManager, GuildPermissionsData } from "./permissions";
import DBUtils from "../../../DBUtils";
import { GuildMember, Role } from "discord.js";
import dot from 'dot-prop';

export class GuildSettings {
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

    private updateCache(path: string, value: any, op: "set" | "delete" = "set") {
        return dot[op](this.guild.data, DBUtils.join(this.dbPath, path), value);
    }

    private getCache<T>(path: string, defaultValue: T): T {
        return dot.get(this.guild.data, DBUtils.join(this.dbPath, path), defaultValue);
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

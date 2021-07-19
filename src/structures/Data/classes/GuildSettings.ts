import { Guild } from "./Guild";
import { UpdateQuery } from 'mongodb';
import { AllowedClientID, defaultData, GuildSettingsManager } from "./GuildSettingsManager";
import { GuildMemberPermissionsManager, GuildRolePermissionsManager, GuildPermissionsData } from "./GuildPermissionsManager";
import DBUtils from "../DBUtils";

export class GuildSettings {
    // Class props //
    readonly guild: Guild;
    readonly manager: GuildSettingsManager;
    readonly clientId: AllowedClientID;
    readonly dbPath: string;
    // Class props //
    // SubClasses //
    readonly permissions: {
        members: GuildMemberPermissionsManager,
        roles: GuildRolePermissionsManager
    };
    // SubClasses //

    constructor(manager: GuildSettingsManager, clientId: AllowedClientID) {
        this.manager = manager;
        this.guild = this.manager.guild;
        this.clientId = clientId;
        this.dbPath = DBUtils.join(this.manager.dbPath, this.clientId);
        this.permissions = {
            members: new GuildMemberPermissionsManager(this),
            roles: new GuildRolePermissionsManager(this)
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
        if (!newPrefix) newPrefix = defaultData[this.clientId].prefix;

        await this.updateDB("prefix", newPrefix);
        return this.guild.data.settings[this.clientId].prefix = newPrefix;
    }
}

export interface GuildSettingsData {
    prefix: string,
    permissions: GuildPermissionsData
}

export default GuildSettings;

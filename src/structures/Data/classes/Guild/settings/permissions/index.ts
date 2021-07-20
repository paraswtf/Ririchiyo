import DBUtils from "../../../../DBUtils";
import { UpdateQuery } from "mongodb";
import {
    Collection,
    GuildMember,
    Role
} from "discord.js";
import Guild from "../..";
import { GuildSettings, GuildSettingsData } from "../GuildSettings";
import {
    GuildPermission,
    GuildPermissionData,
} from "./GuildPermission";

export const defaultGuildPermissionsData = {
    members: {},
    roles: {}
}

export class GuildPermissionsManager<FOR extends keyof GuildSettingsData['permissions'], ENTITY extends (GuildMember | Role)> {
    // Class props //
    readonly guild: Guild;
    readonly settings: GuildSettings;
    readonly forKey: FOR;
    readonly dbPath: string;
    private readonly cache: Collection<string, GuildPermission<FOR, ENTITY>>;
    // Class props //

    constructor(settings: GuildSettings, forKey: FOR) {
        this.guild = settings.guild;
        this.settings = settings;
        this.forKey = forKey;
        this.dbPath = DBUtils.join(this.settings.dbPath, "permissions", this.forKey);
        this.cache = new Collection();
    }

    private async updateDB(path: string, value: any, op: keyof UpdateQuery<GuildPermissionData> = "$set") {
        return await this.guild.db.collections.guilds.updateOne(this.guild.query, {
            [op]: { [DBUtils.join(this.dbPath, path)]: value }
        }, { upsert: true });
    }

    getFor(entity: ENTITY) {
        const cache = this.cache.get(entity.id);
        if (cache) return cache;

        const newInst = new GuildPermission<FOR, ENTITY>(this, entity);

        this.cache.set(entity.id, newInst);
        return newInst;
    }

    async reset() {
        await this.updateDB("", {}, "$set");
        this.guild.data.settings[this.settings.clientId].permissions[this.forKey] = {};
        this.cache.clear();
    }
}

export interface GuildPermissionsData {
    [key: string]: GuildPermissionData
}

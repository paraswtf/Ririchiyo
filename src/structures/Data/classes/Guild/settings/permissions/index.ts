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
import dot from 'dot-prop';

export const defaultGuildPermissionsData = {
    members: {},
    roles: {}
}

export class GuildPermissionsManager<ENTITY extends (GuildMember | Role)> {
    // Class props //
    readonly guild: Guild;
    readonly settings: GuildSettings;
    readonly forKey: keyof GuildSettingsData['permissions'];
    readonly dbPath: string;
    private readonly cache: Collection<string, GuildPermission<ENTITY>>;
    // Class props //

    constructor(settings: GuildSettings, forKey: keyof GuildSettingsData['permissions']) {
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

    private updateCache(path: string, value: any, op: "set" | "delete" = "set") {
        return dot[op](this.guild.data, DBUtils.join(this.dbPath, path), value);
    }

    getFor(entity: ENTITY) {
        const cache = this.cache.get(entity.id);
        if (cache) return cache;

        const newInst = new GuildPermission<ENTITY>(this, entity);

        this.cache.set(entity.id, newInst);
        return newInst;
    }

    async reset() {
        await this.updateDB("", {});
        this.updateCache("", {});
        this.cache.clear();
    }
}

export interface GuildPermissionsData {
    [key: string]: GuildPermissionData
}

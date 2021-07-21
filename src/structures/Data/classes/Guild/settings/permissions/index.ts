import DBUtils, { BaseData } from "../../../../DBUtils";
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

export class GuildPermissionsManager<ENTITY extends (GuildMember | Role)> extends BaseData {
    // Class props //
    readonly guild: Guild;
    readonly settings: GuildSettings;
    readonly forKey: keyof GuildSettingsData['permissions'];
    readonly dbPath: string;
    private readonly cache: Collection<string, GuildPermission<ENTITY>>;
    // Class props //

    constructor(settings: GuildSettings, forKey: keyof GuildSettingsData['permissions']) {
        super();
        this.guild = settings.guild;
        this.settings = settings;
        this.forKey = forKey;
        this.dbPath = DBUtils.join(this.settings.dbPath, "permissions", this.forKey);
        this.cache = new Collection();
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

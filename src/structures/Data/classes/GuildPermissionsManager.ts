import DBUtils from "../DBUtils";
import { UpdateQuery } from "mongodb";
import {
    Collection,
    GuildMember,
    Role
} from "discord.js";
import Guild from "./Guild";
import GuildSettings from "./GuildSettings";
import {
    GuildPermissionData,
    GuildMemberPermission,
    GuildRolePermission
} from "./GuildPermission";

export const defaultData = {
    members: {},
    roles: {}
}

export class BaseGuildPermissionsManager {
    // Class props //
    readonly guild: Guild;
    readonly settings: GuildSettings;
    readonly dbPath: string;
    // Class props //

    constructor(settings: GuildSettings) {
        this.guild = settings.guild;
        this.settings = settings;
        this.dbPath = DBUtils.join(this.settings.dbPath, "permissions");
    }
}

export class GuildMemberPermissionsManager extends BaseGuildPermissionsManager {
    // Class props //
    readonly isMember = true;
    readonly dbPath: string;
    private readonly cache: Collection<string, GuildMemberPermission>;
    // Class props //

    constructor(settings: GuildSettings) {
        super(settings);
        this.dbPath = DBUtils.join(super.dbPath, "members");
        this.cache = new Collection();
    }

    private async updateDB(path: string, value: any, op: keyof UpdateQuery<GuildMembersPermissionData> = "$set") {
        return await this.guild.db.collections.guilds.updateOne(this.guild.query, {
            [op]: { [DBUtils.join(this.dbPath, path)]: value }
        }, { upsert: true });
    }

    // async getAll(): Promise<Collection<string, GuildPermission>> {
    //     const idArray = Object.keys(this.guild.data.settings[this.settings.clientId].permissions.members);
    //     this.guild.discordGuild?.members.fetch({ user: idArray as UserResolvable[] })
    //     for (const id in this.guild.data.settings[this.settings.clientId].permissions.members) this.getFor(id);
    //     return this.cache;
    // }

    getFor(member: GuildMember): GuildMemberPermission {
        const cache = this.cache.get(member.id);
        if (cache) return cache;

        const newInst = new GuildMemberPermission(this, member);

        this.cache.set(member.id, newInst);
        return newInst;
    }

    async reset() {
        await this.updateDB("", {}, "$set");
        this.guild.data.settings[this.settings.clientId].permissions.members = {};
        this.cache.clear();
    }
}

export class GuildRolePermissionsManager extends BaseGuildPermissionsManager {
    // Class props //
    readonly isMember = false;
    readonly dbPath: string;
    private readonly cache: Collection<string, GuildRolePermission>;
    // Class props //

    constructor(settings: GuildSettings) {
        super(settings);
        this.dbPath = DBUtils.join(super.dbPath, "roles");
        this.cache = new Collection();
    }

    private async updateDB(path: string, value: any, op: keyof UpdateQuery<GuildRolesPermissionData> = "$set") {
        return await this.guild.db.collections.guilds.updateOne(this.guild.query, {
            [op]: { [DBUtils.join(this.dbPath, path)]: value }
        }, { upsert: true });
    }

    getFor(role: Role): GuildRolePermission {
        const cache = this.cache.get(role.id);
        if (cache) return cache;

        const newInst = new GuildRolePermission(this, role);

        this.cache.set(role.id, newInst);
        return newInst;
    }

    async reset() {
        await this.updateDB("", {}, "$set");
        this.guild.data.settings[this.settings.clientId].permissions.roles = {};
        this.cache.clear();
    }
}

export interface GuildMembersPermissionData {
    [key: string]: GuildPermissionData
}

export interface GuildRolesPermissionData {
    [key: string]: GuildPermissionData
}

export interface GuildPermissionsData {
    members: GuildMembersPermissionData,
    roles: GuildRolesPermissionData
}

import Guild from './Guild';
import { BitField, GuildMember, Role } from 'discord.js';
import { InternalPermissions, InternalPermissionResolvable } from '../../Utils/InternalPermissions';
import { GuildSettings } from './GuildSettings';
import { GuildMemberPermissionsManager, GuildRolePermissionsManager } from './GuildPermissionsManager';
import { owners } from '../../../config';
import { UpdateQuery } from 'mongodb';
import DBUtils from '../DBUtils';

export const defaultData = {
    allowed: 0,
    denied: 0
}

export class BaseGuildPermission {
    // Class props //
    readonly guild: Guild;
    readonly settings: GuildSettings;
    // Class props //

    constructor(manager: GuildMemberPermissionsManager | GuildRolePermissionsManager) {
        this.guild = manager.settings.guild;
        this.settings = manager.settings;
    }
}

export class GuildMemberPermission extends BaseGuildPermission {
    // Class props //
    readonly isUser = true;
    readonly manager: GuildMemberPermissionsManager;
    readonly entity: GuildMember;
    readonly dbPath: string;
    // Class props //

    constructor(manager: GuildMemberPermissionsManager, entity: GuildMember) {
        super(manager);
        this.manager = manager;
        this.entity = entity;
        this.dbPath = DBUtils.join(this.manager.dbPath, this.entity.id);
    }

    private get data() {
        return this.guild.data.settings[this.settings.clientId].permissions.members[this.entity.id] ?? defaultData;
    }

    private async updateDB(path: string, value: any, op: keyof UpdateQuery<GuildPermissionData> = "$set") {
        return await this.guild.db.collections.guilds.updateOne(this.guild.query, {
            [op]: { [DBUtils.join(this.dbPath, path)]: value }
        }, { upsert: true });
    }

    get allowed(): Readonly<BitField<string>> {
        return new InternalPermissions(this.data.allowed).freeze();
    }

    get denied(): Readonly<BitField<string>> {
        return new InternalPermissions(this.data.denied).freeze();
    }

    get overwrites() {
        return new InternalPermissions(InternalPermissions.DEFAULT).add(this.allowed).remove(this.denied);
    }

    calculatePermissions(): InternalPermissions {
        //Give all perms to the owner
        if (owners.find(o => o.id === this.entity.id)) return new InternalPermissions(InternalPermissions.ALL);
        //Give all perms to admins
        if (this.entity.permissions.has("ADMINISTRATOR")) return new InternalPermissions(InternalPermissions.ALL);
        else {
            const finalPermissions = new InternalPermissions(InternalPermissions.DEFAULT);
            //Sort roles from lowest to highest and map to array
            //Add and remove permissions for each role (lowest to highest - lowest first in array)
            for (const [roleID, role] of this.entity.roles.cache.sort((a, b) => a.position - b.position)) {
                const rolePerms = this.settings.permissions.roles.getFor(role);
                finalPermissions.add(rolePerms.allowed).remove(rolePerms.denied);
            }

            //User permissions override everything else
            return finalPermissions.add(this.allowed).remove(this.denied);
        }
    }

    async allow(permission: InternalPermissionResolvable): Promise<this> {
        const updated = {
            allowed: new InternalPermissions(this.allowed).add(permission).bitfield,
            denied: new InternalPermissions(this.denied).remove(permission).bitfield
        }

        this.guild.data.settings[this.settings.clientId].permissions.members[this.entity.id] = updated;

        await this.updateDB("", updated);

        return this;
    }

    async deny(permission: InternalPermissionResolvable): Promise<this> {
        const updated = {
            allowed: new InternalPermissions(this.allowed).remove(permission).bitfield,
            denied: new InternalPermissions(this.denied).add(permission).bitfield
        }

        this.guild.data.settings[this.settings.clientId].permissions.members[this.entity.id] = updated;

        await this.updateDB("", updated);

        return this;
    }

    async reset(permission?: InternalPermissionResolvable): Promise<this> {
        if (!permission) permission = InternalPermissions.ALL;

        const updated = {
            allowed: new InternalPermissions(this.allowed).remove(permission).bitfield,
            denied: new InternalPermissions(this.denied).remove(permission).bitfield
        }

        //If the value is not empty
        if (updated.allowed !== 0 || updated.denied !== 0) {
            this.guild.data.settings[this.settings.clientId].permissions.members[this.entity.id] = updated;

            await this.updateDB("", updated);
        }
        else {
            delete this.guild.data.settings[this.settings.clientId].permissions.members[this.entity.id];

            await this.updateDB("", null, "$unset");
        }

        return this;
    }
}

export class GuildRolePermission extends BaseGuildPermission {
    // Class props //
    readonly isUser = false;
    readonly manager: GuildRolePermissionsManager;
    readonly entity: Role;
    readonly dbPath: string;
    // Class props //

    constructor(manager: GuildRolePermissionsManager, entity: Role) {
        super(manager);
        this.manager = manager;
        this.entity = entity;
        this.dbPath = DBUtils.join(this.manager.dbPath, this.entity.id);
    }

    private get data() {
        return this.guild.data.settings[this.settings.clientId].permissions.roles[this.entity.id] ?? defaultData;
    }

    private async updateDB(path: string, value: any, op: keyof UpdateQuery<GuildPermissionData> = "$set") {
        return await this.guild.db.collections.guilds.updateOne(this.guild.query, {
            [op]: { [DBUtils.join(this.dbPath, path)]: value }
        }, { upsert: true });
    }

    get allowed(): Readonly<BitField<string>> {
        return new InternalPermissions(this.data.allowed).freeze();
    }

    get denied(): Readonly<BitField<string>> {
        return new InternalPermissions(this.data.denied).freeze();
    }

    get overwrites() {
        return new InternalPermissions(InternalPermissions.DEFAULT).add(this.allowed).remove(this.denied);
    }

    calculatePermissions(): InternalPermissions {
        return this.overwrites;
    }

    async allow(permission: InternalPermissionResolvable): Promise<this> {
        const updated = {
            allowed: new InternalPermissions(this.allowed).add(permission).bitfield,
            denied: new InternalPermissions(this.denied).remove(permission).bitfield
        }

        this.guild.data.settings[this.settings.clientId].permissions.roles[this.entity.id] = updated;

        await this.updateDB("", updated);

        return this;
    }

    async deny(permission: InternalPermissionResolvable): Promise<this> {
        const updated = {
            allowed: new InternalPermissions(this.allowed).remove(permission).bitfield,
            denied: new InternalPermissions(this.denied).add(permission).bitfield
        }

        this.guild.data.settings[this.settings.clientId].permissions.roles[this.entity.id] = updated;

        await this.updateDB("", updated);

        return this;
    }

    async reset(permission?: InternalPermissionResolvable): Promise<this> {
        if (!permission) permission = InternalPermissions.ALL;

        const updated = {
            allowed: new InternalPermissions(this.allowed).remove(permission).bitfield,
            denied: new InternalPermissions(this.denied).remove(permission).bitfield
        }

        //If the value is not empty
        if (updated.allowed !== 0 || updated.denied !== 0) {
            this.guild.data.settings[this.settings.clientId].permissions.roles[this.entity.id] = updated;

            await this.updateDB("", updated);
        }
        else {
            delete this.guild.data.settings[this.settings.clientId].permissions.roles[this.entity.id];

            await this.updateDB("", null, "$unset");
        }

        return this;
    }
}

export interface GuildPermissionData {
    allowed: number,
    denied: number
}

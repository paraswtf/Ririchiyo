import Guild from '../..';
import { BitField, GuildMember, Role } from 'discord.js';
import { InternalPermissions, InternalPermissionResolvable } from '../../../../../Utils/music/InternalPermissions';
import { GuildSettings } from '../GuildSettings';
import { GuildPermissionsManager } from '.';
import { owners } from '../../../../../../config';
import DBUtils, { BaseData } from '../../../../DBUtils';

export const defaultGuildPermissionData = {
    allowed: 0,
    denied: 0
}

export class GuildPermission<ENTITY extends (GuildMember | Role)> extends BaseData {
    // Class props //
    readonly guild: Guild;
    readonly settings: GuildSettings;
    readonly manager: GuildPermissionsManager<ENTITY>;
    readonly entity: ENTITY;
    readonly dbPath: string;
    // Class props //

    constructor(manager: GuildPermissionsManager<ENTITY>, entity: ENTITY) {
        super();
        this.guild = manager.settings.guild;
        this.settings = manager.settings;
        this.manager = manager;
        this.entity = entity;
        this.dbPath = DBUtils.join(this.manager.dbPath, this.entity.id);
    }

    private get data() {
        return this.getCache("", defaultGuildPermissionData);
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
        //If this is a role return overwrites
        if (this.entity instanceof Role) return this.overwrites;

        //Give all perms to the owner
        if (owners.find(o => o.id === this.entity.id)) return new InternalPermissions(InternalPermissions.ALL);
        //Give all perms to admins/mods
        if (this.entity.permissions.any(['ADMINISTRATOR', 'MANAGE_GUILD'])) return new InternalPermissions(InternalPermissions.ALL);
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

    async allow(permission: InternalPermissionResolvable) {
        const updated = {
            allowed: new InternalPermissions(this.allowed).add(permission).bitfield,
            denied: new InternalPermissions(this.denied).remove(permission).bitfield
        }

        await this.updateDB("", updated);
        this.updateCache("", updated);

        return this;
    }

    async deny(permission: InternalPermissionResolvable) {
        const updated = {
            allowed: new InternalPermissions(this.allowed).remove(permission).bitfield,
            denied: new InternalPermissions(this.denied).add(permission).bitfield
        }

        await this.updateDB("", updated);
        this.updateCache("", updated);

        return this;
    }

    async reset(permission?: InternalPermissionResolvable) {
        if (!permission) permission = InternalPermissions.ALL;

        const updated = {
            allowed: new InternalPermissions(this.allowed).remove(permission).bitfield,
            denied: new InternalPermissions(this.denied).remove(permission).bitfield
        }

        //If the value is not empty
        if (updated.allowed !== 0 || updated.denied !== 0) {
            await this.updateDB("", updated);
            this.updateCache("", updated);
        }
        else {
            await this.updateDB("", null, "$unset");
            this.updateCache("", null, "delete");
        }

        return this;
    }
}

export interface GuildPermissionData {
    allowed: number,
    denied: number
}

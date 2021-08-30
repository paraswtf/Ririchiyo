import { BitField } from 'discord.js';

export type InternalPermissionResolvable = number | "SUMMON_PLAYER" | "VIEW_QUEUE" | "ADD_TO_QUEUE" | "MANAGE_QUEUE" | "MANAGE_PLAYER" | "DJ" | InternalPermissionResolvable[];

export class InternalPermissions extends BitField<string> {
    static ALL: number;
    static DEFAULT: number;

    /**
    * Numeric permission flags. All available properties:
    * * `DJ` implicitly has *all* permissions
    * * `MANAGE_PLAYER`
    * * `MANAGE_QUEUE`
    * * `ADD_TO_QUEUE`
    * * `VIEW_QUEUE`
    * * `SUMMON_PLAYER`
    */
    static FLAGS = {
        SUMMON_PLAYER: 1 << 0,
        VIEW_QUEUE: 1 << 1,
        ADD_TO_QUEUE: 1 << 2,
        MANAGE_QUEUE: 1 << 3,
        MANAGE_PLAYER: 1 << 4,
        DJ: 1 << 5,
    };
    /**
    * Checks whether the bitfield has a permission, or any of multiple permissions.
    * @param  permission Permission(s) to check for
    * @param checkDJ Whether to allow the DJ permission to override
    */
    any(permission: InternalPermissionResolvable, checkDJ = true): boolean {
        return (checkDJ && super.has(InternalPermissions.FLAGS.DJ)) || super.any(permission);
    }

    /**
    * Checks whether the bitfield has a permission, or multiple permissions.
    * @param permission Permission(s) to check for
    * @param checkDJ Whether to allow the DJ permission to override
    */
    has(permission: InternalPermissionResolvable, checkDJ = true): boolean {
        return (checkDJ && super.has(InternalPermissions.FLAGS.DJ)) || super.has(permission);
    }
}

/**
 * Bitfield representing every permission combined
 * @type {number}
 */
InternalPermissions.ALL = Object.values(InternalPermissions.FLAGS).reduce((all, p) => all | p, 0);

/**
 * Bitfield representing the default permissions for users
 * @type {number}
 */
InternalPermissions.DEFAULT = 7;

export default InternalPermissions;
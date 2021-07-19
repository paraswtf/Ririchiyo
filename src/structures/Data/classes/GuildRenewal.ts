import Utils from '../../Utils';
import Guild from './Guild';

export class BaseGuildRenewal {
    // Class props //
    readonly guild: Guild;
    readonly id: string;
    readonly createdAt: number;
    readonly duration: number;
    readonly expiry: number;
    readonly invalidated?: RenewalInvalidated;
    readonly query: QueryToRenewal;
    // Class props //

    constructor(guild: Guild, data: GuildRenewalData) {
        this.guild = guild;
        this.id = data.id;
        this.duration = data.duration;
        const { timestamp } = Utils.snowflake.deconstruct(this.id);
        this.createdAt = timestamp as unknown as number;
        this.expiry = this.createdAt + this.duration;
        this.invalidated = data.invalidated
            || Date.now() > this.expiry
            ? { at: this.expiry, reason: "EXPIRED" }
            : undefined;
        this.query = {
            "_id": this.guild.id,
            "premium.renewals.id": this.id
        };
    }


    async remove(data: RenewalRemoved) {
        await this.guild.db.collections.guilds.updateOne(
            this.query,
            {
                $set: {
                    "premium.renewals.$.invalidated": data
                }
            }
        )
        this.guild.data.premium.renewals[this.guild.data.premium.renewals.findIndex(d => d.id === this.id)].invalidated = data;
        return Object.assign(this, {
            invalidated: data
        });
    }

    get isValid() {
        return !this.isInvalid;
    }

    get isInvalid() {
        if (!this.invalidated && Date.now() > this.expiry) Object.assign(this, {
            invalidated: {
                at: this.expiry,
                reason: "EXPIRED"
            }
        });
        return Boolean(this.invalidated);
    }

    get isExpired() {
        return this.isInvalid && this.invalidated?.reason === "EXPIRED";
    }

    get isRemoved() {
        return this.isInvalid && this.invalidated?.reason === "REMOVED";
    }
}

export class UserGuildRenewal extends BaseGuildRenewal {
    // Class props //
    readonly type: UserGuildRenewalData['type'];
    readonly by: string;
    // Class props //

    constructor(guild: Guild, data: UserGuildRenewalData) {
        super(guild, data);
        this.type = data.type;
        this.by = data.by;
    }

    toJSON(): UserGuildRenewalData {
        return {
            id: this.id,
            duration: this.duration,
            type: this.type,
            by: this.by,
            invalidated: this.invalidated?.reason === "REMOVED" ? this.invalidated : undefined
        }
    }
}

export class RewardGuildRenewal extends BaseGuildRenewal {
    // Class props //
    readonly type: RewardGuildRenewalData['type'];
    // Class props //

    constructor(guild: Guild, data: RewardGuildRenewalData) {
        super(guild, data);
        this.type = data.type;
    }

    toJSON(): RewardGuildRenewalData {
        return {
            id: this.id,
            duration: this.duration,
            type: this.type,
            invalidated: this.invalidated?.reason === "REMOVED" ? this.invalidated : undefined
        }
    }
}

export type GuildRenewal = UserGuildRenewal | RewardGuildRenewal;

export type QueryToRenewal = { "_id": string, "premium.renewals.id": string };

export type GuildRenewalData = UserGuildRenewalData | RewardGuildRenewalData
export interface UserGuildRenewalData {
    /** Snowflake ID created when this object was created for the guild, ie., when the premium was added to the guild */
    id: string,
    /** How long this should last, the expiry calculated by finding the createdAt date from id then createdAt + duration = expiry */
    duration: number,
    /** The type of this renewal */
    type: "ADDED", //Added by a user, admin or user
    /** The snowflake ID of the user who added this */
    by: string,
    /** If this object is invalidated */
    invalidated?: RenewalRemoved
}
export interface RewardGuildRenewalData {
    /** Snowflake ID created when this object was created for the guild, ie., when the premium was added to the guild */
    id: string,
    /** How long this should last, the expiry calculated by finding the createdAt date from id then createdAt + duration = expiry */
    duration: number,
    /** The type of this renewal */
    type: "REWARD", //A reward with no user
    /** If this object is invalidated */
    invalidated?: RenewalRemoved
}

export type RenewalInvalidated = RenewalRemoved | RenewalExpired
export interface RenewalRemoved {
    /** The timestamp when this was invalidated */
    at: number,
    /** The user who invalidated this */
    by: string
    /** The reason this was invalidated */
    reason: "REMOVED" //Removed by a user, admin or user
}
export interface RenewalExpired {
    /** The timestamp when this was invalidated */
    at: number,
    /** The reason this was invalidated */
    reason: "EXPIRED" //Expired
}

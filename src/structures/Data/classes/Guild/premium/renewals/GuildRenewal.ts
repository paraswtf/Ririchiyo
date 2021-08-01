import Utils from '../../../../../Utils';
import Guild from '../..';

export class GuildRenewal<T extends GuildRenewalData = GuildRenewalData> {
    // Class props //
    readonly guild: Guild;
    readonly id: string;
    readonly type: T['type'];
    readonly by: T['by'];
    readonly createdAt: number;
    readonly duration: number;
    readonly expiry: number;
    readonly invalidated?: RenewalInvalidated;
    readonly query: QueryToRenewal;
    // Class props //

    constructor(guild: Guild, data: T) {
        this.guild = guild;
        this.id = data.id;
        this.type = data.type;
        this.by = data.by;
        this.duration = data.duration;
        const { timestamp } = Utils.snowflake.deconstruct(this.id);
        this.createdAt = timestamp as unknown as number;
        this.expiry = this.createdAt + this.duration;
        this.query = { "_id": this.guild.id, "premium.renewals.id": this.id };
        if (!data.invalidated && Date.now() > this.expiry) {
            this.invalidated = { at: this.expiry, reason: "EXPIRED" } as RenewalInvalidated<"EXPIRED">;
            this.guild.db.collections.guilds.updateOne(
                this.query,
                {
                    $set: {
                        "premium.renewals.$.invalidated": this.invalidated
                    }
                }
            ).catch(Utils.client.logger.error);
        }
        else this.invalidated = data.invalidated;
    }

    async invalidate(data: RenewalInvalidated<"REMOVED">) {
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

    toJSON(): T {
        return {
            id: this.id,
            duration: this.duration,
            type: this.type,
            by: this.by,
            invalidated: this.invalidated
        } as T
    }
}

export type QueryToRenewal = { "_id": string, "premium.renewals.id": string };

export interface GuildRenewalData<T extends GuildRenewalType = GuildRenewalType> {
    /** Snowflake ID created when this object was created for the guild, ie., when the premium was added to the guild */
    id: string,
    /** How long this should last, the expiry calculated by finding the createdAt date from id then createdAt + duration = expiry */
    duration: number,
    /** The type of this renewal */
    type: T,
    /** The snowflake ID of the user who added this */
    by: T extends "ADDED" ? string : undefined,
    /** If this object is invalidated */
    invalidated?: RenewalInvalidated
}

export type GuildRenewalType =
    | "ADDED" //Added by a user, admin or user
    | "REWARD" //Added as an automated reward without user

export interface RenewalInvalidated<REASON extends RenewalInvalidatedReason = RenewalInvalidatedReason> {
    /** The timestamp when this was invalidated */
    at: number,
    /** The reason this was invalidated */
    reason: REASON, //Removed by a user, admin or user
    /** The user who invalidated this */
    by: REASON extends "REMOVED" ? string : undefined
}

export type RenewalInvalidatedReason =
    | "REMOVED" //Removed by a user, admin or user
    | "EXPIRED" //Expired

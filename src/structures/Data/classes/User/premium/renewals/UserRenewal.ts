import Utils from '../../../../../Utils';
import User from '../..';

export class UserRenewal<T extends UserRenewalData = UserRenewalData> {
    // Class props //
    readonly user: User;
    readonly id: string;
    readonly type: T['type'];
    readonly allowedBoosts: T['allowedBoosts'];
    readonly giftedBy: T['giftedBy'];
    readonly transactionID: T['transactionID'];
    readonly createdAt: number;
    readonly duration: number;
    readonly expiry: number;
    readonly invalidated?: RenewalInvalidated;
    readonly query: QueryToRenewal;
    // Class props //

    constructor(user: User, data: T) {
        this.user = user;
        this.id = data.id;
        this.type = data.type;
        this.allowedBoosts = data.allowedBoosts;
        this.giftedBy = data.giftedBy;
        this.transactionID = data.transactionID;
        this.duration = data.duration;
        const { timestamp } = Utils.snowflake.deconstruct(this.id);
        this.createdAt = timestamp as unknown as number;
        this.expiry = this.createdAt + this.duration;
        this.query = { "_id": this.user.id, "premium.renewals.id": this.id };
        if (!data.invalidated && Date.now() > this.expiry) {
            this.invalidated = { at: this.expiry, reason: "EXPIRED" } as RenewalInvalidated<"EXPIRED">;
            this.user.db.collections.users.updateOne(
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

    async invalidate(data: RenewalInvalidated<"CANCELLED">) {
        await this.user.db.collections.users.updateOne(
            this.query,
            {
                $set: {
                    "premium.renewals.$.invalidated": data
                }
            }
        )
        this.user.data.premium.renewals[this.user.data.premium.renewals.findIndex(d => d.id === this.id)].invalidated = data;
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

    get isCancelled() {
        return this.isInvalid && this.invalidated?.reason === "CANCELLED";
    }

    toJSON(): T {
        return {
            id: this.id,
            duration: this.duration,
            type: this.type,
            allowedBoosts: this.allowedBoosts,
            giftedBy: this.giftedBy,
            transactionID: this.transactionID,
            invalidated: this.invalidated
        } as T
    }
}

export type QueryToRenewal = { "_id": string, "premium.renewals.id": string };

export interface UserRenewalData<T extends UserRenewalType = UserRenewalType> {
    /** Snowflake ID created when this object was created for the user, ie., when the premium was added to the user */
    id: string,
    /** How long this should last, the expiry calculated by finding the createdAt date from id then createdAt + duration = expiry */
    duration: number,
    /** The type of this renewal */
    type: T,
    /** The number of guilds this user can boost */
    allowedBoosts: number,
    /** The snowflake ID of the user who gifted this */
    giftedBy: T extends "GIFT" ? string : undefined,
    /** The transaction ID if this was purchased */
    transactionID: T extends "PURCHASE" ? string : undefined,
    /** If this object is invalidated */
    invalidated?: RenewalInvalidated
}

export type UserRenewalType =
    | "GIFT" //Gifted by a user, admin or user
    | "REWARD" //Added as an automated reward without user
    | "PURCHASE" //If this was a paid purchase

export interface RenewalInvalidated<REASON extends RenewalInvalidatedReason = RenewalInvalidatedReason> {
    /** The timestamp when this was invalidated */
    at: number,
    /** The reason this was invalidated */
    reason: REASON
}

export type RenewalInvalidatedReason =
    | "CANCELLED" //Cancelled by a user, admin or user
    | "EXPIRED" //Expired

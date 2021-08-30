import { DeconstructedSnowflake } from '@sapphire/snowflake';
import {
    Utils,
    CustomError
} from '../../../../Utils';
import { User } from '..';
import {
    UserRenewal,
    UserRenewalData,
    RenewalInvalidated
} from './renewals/UserRenewal';
import { Guild as DiscordGuild } from 'discord.js';

export const defaultUserPremiumData = {
    renewals: [],
    guilds: []
}

/**
 * User Premium Data
 */
export class UserPremium {
    // Class props //
    readonly user: User;
    readonly renewals: UserRenewal[];
    // Class props //

    constructor(user: User) {
        this.user = user;
        this.renewals = this.user.data.premium.renewals.map(d => new UserRenewal(this.user, d));
    }

    get guilds() {
        return this.user.data.premium.guilds;
    }

    get latestRenewal() {
        return this.renewals[this.renewals.length - 1]
    }

    get isValid() {
        return true || this.latestRenewal.isValid;
    }

    get isInvalid() {
        return this.latestRenewal.isInvalid;
    }

    get isExpired() {
        return this.latestRenewal.isExpired;
    }

    get isCancelled() {
        return this.latestRenewal.isCancelled;
    }

    private generateRenewal(expiresAt: number, options: generateRenewalOptions = { allowedBoosts: 1 }) {
        if (expiresAt <= Date.now()) throw new CustomError("The expiry must be grater than the current timestamp.");

        if (!options.snowflake) options.snowflake = Utils.snowflake.deconstruct(Utils.snowflake.generate());

        const data: UserRenewalData = {
            id: options.snowflake.id.toString(),
            type: options.userID ? "GIFT" : (options.transactionID ? "PURCHASE" : "REWARD"),
            allowedBoosts: options.allowedBoosts,
            duration: expiresAt - Number.parseInt(options.snowflake.timestamp.toString()),
            giftedBy: options.userID,
            transactionID: options.transactionID
        }

        return new UserRenewal(this.user, data);
    }

    async addRenewal(expiresAt: number, options: generateRenewalOptions) {
        if (this.isValid) throw new Error("Already enabled.");

        const renewal = this.generateRenewal(expiresAt, options);

        await this.user.db.collections.users.updateOne(this.user.query, { $push: { "premium.renewals": renewal.toJSON() } }, { upsert: true });
        this.user.data.premium.renewals.push(renewal.toJSON());
        this.renewals.push(renewal);
        return renewal;
    }

    async addGuild(guild: DiscordGuild) {
        if (this.isInvalid) throw new Error("No premium to add guild.");

        const guildData = await this.user.db.getGuild(guild);
        if (guildData.premium.isValid) throw new Error("Guild already has premium.");

        if (this.latestRenewal.allowedBoosts <= this.guilds.length) throw new Error("Maximum guilds already reached for current renewal.");

        await this.user.db.collections.users.updateOne(this.user.query, { $push: { "premium.guilds": guild.id } }, { upsert: true });
        this.user.data.premium.guilds.push(guild.id);
        return await guildData.premium.addRenewal(this.latestRenewal.expiry, { userID: this.user.id });
    }

    async removeGuild(guild: DiscordGuild) {
        if (!this.guilds.some(g => g === guild.id)) throw new Error("Guild does not exist in user's premium!");

        Utils.removeKnownElement(this.guilds, guild.id);
        await this.user.db.collections.users.updateOne(this.user.query, { $pull: { "premium.guilds": guild.id } }, { upsert: true });

        const guildData = await this.user.db.getGuild(guild);
        if (guildData.premium.isValid && guildData.premium.latestRenewal.by === this.user.id) return await guildData.premium.invalidateRenewal({
            by: this.user.id,
            at: Date.now(),
            reason: "REMOVED"
        });
    }

    async invalidateRenewal(data: RenewalInvalidated<"CANCELLED">): Promise<UserRenewal & { invalidated: RenewalInvalidated<"CANCELLED"> }> {
        if (this.isInvalid) throw new Error("Not enabled.");
        return await this.latestRenewal.invalidate(data);
    }
}

export type generateRenewalOptions = {
    snowflake?: DeconstructedSnowflake,
    allowedBoosts: number
} & ({
    userID: string,
    transactionID?: undefined
} | {
    userID?: undefined
    transactionID: string
} | {
    userID?: undefined
    transactionID?: undefined
})

export type AddRenewalOptions =
    | { duration: number, expiry: undefined }
    | { duration: undefined, expiry: number }

export interface UserPremiumData {
    renewals: UserRenewalData[];
    guilds: string[]
}

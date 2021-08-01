import { DeconstructedSnowflake } from '@sapphire/snowflake';
import {
    Utils,
    CustomError
} from '../../../../Utils';
import Guild from '..';
import {
    GuildRenewal,
    GuildRenewalData,
    RenewalInvalidated
} from './renewals/GuildRenewal';

export const defaultGuildPremiumData = {
    renewals: []
}

/**
 * Guild Premium Data
 */
export class GuildPremium {
    // Class props //
    guild: Guild;
    renewals: GuildRenewal[];
    // Class props //

    constructor(guild: Guild) {
        this.guild = guild;
        this.renewals = this.guild.data.premium.renewals.map(d => new GuildRenewal(this.guild, d));
    }

    get latestRenewal() {
        return this.renewals[this.renewals.length - 1]
    }

    get isValid() {
        return this.latestRenewal.isValid;
    }

    get isInvalid() {
        return this.latestRenewal.isInvalid;
    }

    get isExpired() {
        return this.latestRenewal.isExpired;
    }

    get isRemoved() {
        return this.latestRenewal.isRemoved;
    }

    private generateRenewal(expiresAt: number, options: generateRenewalOptions = {}) {
        if (expiresAt <= Date.now()) throw new CustomError("The expiry must be grater than the current timestamp.");

        if (!options.snowflake) options.snowflake = Utils.snowflake.deconstruct(Utils.snowflake.generate());

        const data: GuildRenewalData = {
            id: options.snowflake.id.toString(),
            type: options.userID ? "ADDED" : "REWARD",
            duration: expiresAt - Number.parseInt(options.snowflake.timestamp.toString()),
            by: options.userID
        }

        return new GuildRenewal(this.guild, data);
    }

    async addRenewal(expiresAt: number, options: generateRenewalOptions = {}) {
        if (this.isValid) throw new Error("Already enabled.");

        const renewal = this.generateRenewal(expiresAt, options);

        await this.guild.db.collections.guilds.updateOne(this.guild.query, { $push: { "premium.renewals": renewal.toJSON() } }, { upsert: true });
        this.guild.data.premium.renewals.push(renewal.toJSON());
        this.renewals.push(renewal);
        return renewal;
    }

    async invalidateRenewal(data: RenewalInvalidated<"REMOVED">): Promise<GuildRenewal & { invalidated: RenewalInvalidated<"REMOVED"> }> {
        if (this.isInvalid) throw new Error("Not enabled.");
        return await this.latestRenewal.invalidate(data);
    }
}

export interface generateRenewalOptions {
    userID?: string,
    snowflake?: DeconstructedSnowflake
}

export type AddRenewalOptions =
    | { duration: number, expiry: undefined }
    | { duration: undefined, expiry: number }

export interface GuildPremiumData {
    renewals: GuildRenewalData[];
}

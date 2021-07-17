import { DeconstructedSnowflake } from '@sapphire/snowflake';
import {
    Utils,
    CustomError
} from '../../Utils';
import Guild from './Guild';
import {
    GuildRenewal,
    GuildRenewalData,
    UserGuildRenewal,
    RewardGuildRenewal,
    RenewalRemoved
} from './GuildRenewal';

export const defaultData = {
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
        this.renewals = this.guild.data.premium.renewals.map(d => d.type === "ADDED" ? new UserGuildRenewal(this.guild, d) : new RewardGuildRenewal(this.guild, d));
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

    private generateRenewal(expiresAt: number, userID?: string | null, snowflake = Utils.snowflake.deconstruct(Utils.snowflake.generate())): GuildRenewal {
        if (expiresAt <= Date.now()) throw new CustomError("The expiry must be grater than the current timestamp.");

        const data: GuildRenewalData = userID ? {
            id: snowflake.id.toString(),
            type: "ADDED",
            duration: expiresAt - Number.parseInt(snowflake.timestamp.toString()),
            by: userID
        } : {
            id: snowflake.id.toString(),
            type: "REWARD",
            duration: expiresAt - Number.parseInt(snowflake.timestamp.toString())
        }

        return data.type === "ADDED" ? new UserGuildRenewal(this.guild, data) : new RewardGuildRenewal(this.guild, data);
    }

    async addRenewal(userID: string, expiresAt: number, snowflake?: DeconstructedSnowflake): Promise<GuildRenewal> {
        if (this.isValid) throw new Error("Already enabled.");

        const renewal = this.generateRenewal(expiresAt, userID, snowflake);

        await this.guild.DB.collections.guilds.updateOne({ _id: this.guild.id }, { $push: { "premium.renewals": renewal.toJSON() } }, { upsert: true });
        this.guild.data.premium.renewals.push(renewal.toJSON());
        this.renewals.push(renewal);
        return renewal;
    }

    async remove(data: RenewalRemoved): Promise<GuildRenewal & { invalidated: RenewalRemoved }> {
        if (this.isInvalid) throw new Error("Not enabled.");
        return await this.latestRenewal.remove(data);
    }


}

export type AddRenewalOptions =
    | { duration: number, expiry: undefined }
    | { duration: undefined, expiry: number }

export interface GuildPremiumData {
    renewals: GuildRenewalData[];
}

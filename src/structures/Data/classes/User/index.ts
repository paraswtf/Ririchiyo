import DB from '../../Database';
import merge from 'deepmerge';
import { User as DiscordUser } from 'discord.js';
import {
    defaultUserPremiumData,
    UserPremium,
    UserPremiumData
} from './premium';

export const defaultUserData = {
    _id: "default",
    premium: defaultUserPremiumData
}

export class User {
    // Class props //
    readonly db: DB;
    readonly dbPath: string;
    readonly query: UserQuery;
    readonly data: UserData;
    readonly discordUser: DiscordUser | null;
    readonly id: string;
    readonly premium: UserPremium;
    // Class props //
    constructor(db: DB, discordUser: DiscordUser | null, data: Partial<UserData>) {
        this.db = db;
        this.discordUser = discordUser;
        this.dbPath = "";
        this.data = merge(defaultUserData, data);
        this.query = { _id: this.data._id };
        this.id = this.data._id;
        this.premium = new UserPremium(this);
    }
}

export interface UserData {
    _id: string,
    premium: UserPremiumData
}

export interface UserQuery {
    _id: string
};

export default User;

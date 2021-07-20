import DBUtils from "../../../../DBUtils";
import { UpdateQuery } from "mongodb";
import dot from 'dot-prop';
import { Guild } from "../..";
import { GuildSettings, GuildSettingsData } from "..";
import { defaultGuildMusicFiltersSettingsData, GuildMusicFiltersSettingsData } from "./GuildMusicFiltersManager";

export const defaultGuildMusicSettingsData: GuildMusicSettingsData = {
    loopState: "DISABLED",
    filters: defaultGuildMusicFiltersSettingsData
}

export class GuildMusicSettings {
    // Class props //
    readonly guild: Guild;
    readonly settings: GuildSettings;
    readonly dbPath: string;
    // Class props //

    constructor(settings: GuildSettings) {
        this.guild = settings.guild;
        this.settings = settings;
        this.dbPath = DBUtils.join(this.settings.dbPath, "music");
    }

    private async updateDB(path: string, value: any, op: keyof UpdateQuery<GuildMusicSettingsData> = "$set") {
        return await this.guild.db.collections.guilds.updateOne(this.guild.query, {
            [op]: { [DBUtils.join(this.dbPath, path)]: value }
        }, { upsert: true });
    }

    private updateCache(path: string, value: any, op: "set" | "delete" = "set") {
        return dot[op](this.guild.data, DBUtils.join(this.dbPath, path), value);
    }

    private getCache<T>(path: string, defaultValue: T): T {
        return dot.get(this.guild.data, DBUtils.join(this.dbPath, path), defaultValue);
    }

    get loopState() {
        return this.getCache("loopState", defaultGuildMusicSettingsData.loopState);
    }

    async setLoopState(state: GuildMusicSettingsLoopState = "DISABLED") {
        this.updateDB("loopState", state);
        return this.updateCache("loopState", state);
    }
}

export interface GuildMusicSettingsData {
    loopState: GuildMusicSettingsLoopState,
    filters: GuildMusicFiltersSettingsData
}

export type GuildMusicSettingsLoopState = "DISABLED" | "QUEUE" | "TRACK";

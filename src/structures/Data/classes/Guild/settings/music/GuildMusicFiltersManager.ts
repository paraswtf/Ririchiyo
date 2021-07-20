import { UpdateQuery } from "mongodb";
import dot from 'dot-prop';
import { ShoukakuGroupedFilterOptions } from "shoukaku";
import { GuildMusicSettings } from ".";
import { GuildSettings } from "..";
import { Guild } from "../..";
import DBUtils from "../../../../DBUtils";
import { CustomError } from "../../../../../Utils";

export const defaultGuildMusicFiltersSettingsData: GuildMusicFiltersSettingsData
    & {
        volume: number
    } = {
    volume: 70,
}

export class GuildMusicFiltersManager {
    // Class props //
    readonly guild: Guild;
    readonly settings: GuildSettings;
    readonly musicSettings: GuildMusicSettings;
    readonly dbPath: string;
    // Class props //

    constructor(musicSettings: GuildMusicSettings) {
        this.guild = musicSettings.guild;
        this.settings = musicSettings.settings;
        this.musicSettings = musicSettings;
        this.dbPath = DBUtils.join(this.musicSettings.dbPath, "filters");
    }

    private async updateDB(path: string, value: any, op: keyof UpdateQuery<GuildMusicFiltersSettingsData> = "$set") {
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

    get grouped() {
        return this.getCache("", defaultGuildMusicFiltersSettingsData);
    }

    async setGrouped(filters: GuildMusicFiltersSettingsData) {
        await this.updateDB("", filters);
        this.updateCache("", filters);
        return this;
    }

    get volume(): number {
        return this.getCache("volume", defaultGuildMusicFiltersSettingsData.volume);
    }

    async setVolume(value: number) {
        if (value < 0 || value > 1000) throw new CustomError("Volume value must be between 0 and 1000");
        await this.updateDB("volume", value);
        this.updateCache("volume", value);
        return this;
    }
}

export type GuildMusicFiltersSettingsData = ShoukakuGroupedFilterOptions;

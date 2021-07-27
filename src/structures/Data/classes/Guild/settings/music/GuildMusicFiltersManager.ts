import { UpdateQuery } from "mongodb";
import dot from 'dot-prop';
import { ShoukakuGroupedFilterOptions } from "shoukaku";
import { GuildMusicSettings } from ".";
import { GuildSettings } from "..";
import { Guild } from "../..";
import DBUtils, { BaseData } from "../../../../DBUtils";
import { CustomError } from "../../../../../Utils";

export const defaultGuildMusicFiltersSettingsData: GuildMusicFiltersSettingsData
    & {
        volume: number
    } = {
    volume: 0.7,
}

export class GuildMusicFiltersManager extends BaseData {
    // Class props //
    readonly guild: Guild;
    readonly settings: GuildSettings;
    readonly musicSettings: GuildMusicSettings;
    readonly dbPath: string;
    // Class props //

    constructor(musicSettings: GuildMusicSettings) {
        super();
        this.guild = musicSettings.guild;
        this.settings = musicSettings.settings;
        this.musicSettings = musicSettings;
        this.dbPath = DBUtils.join(this.musicSettings.dbPath, "filters");
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
        if (value < 0 || value > 500) throw new CustomError("Volume value must be between 0 and 500");
        await this.updateDB("volume", value);
        this.updateCache("volume", value);
        return this;
    }
}

export type GuildMusicFiltersSettingsData = ShoukakuGroupedFilterOptions;

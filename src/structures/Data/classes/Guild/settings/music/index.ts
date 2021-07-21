import DBUtils, { BaseData } from "../../../../DBUtils";
import { UpdateQuery } from "mongodb";
import dot from 'dot-prop';
import { Guild } from "../..";
import { GuildSettings, GuildSettingsData } from "..";
import { defaultGuildMusicFiltersSettingsData, GuildMusicFiltersManager, GuildMusicFiltersSettingsData } from "./GuildMusicFiltersManager";
import { CustomError } from "../../../../../Utils";

export const defaultGuildMusicSettingsData: GuildMusicSettingsData = {
    loopState: "DISABLED",
    filters: defaultGuildMusicFiltersSettingsData
}

export class GuildMusicSettings extends BaseData {
    // Class props //
    readonly guild: Guild;
    readonly settings: GuildSettings;
    readonly dbPath: string;
    // Class props //
    // SubClasses //
    readonly filters: GuildMusicFiltersManager;
    // SubClasses //

    constructor(settings: GuildSettings) {
        super();
        this.guild = settings.guild;
        this.settings = settings;
        this.dbPath = DBUtils.join(this.settings.dbPath, "music");
        this.filters = new GuildMusicFiltersManager(this);
    }

    get loopState() {
        return this.getCache("loopState", defaultGuildMusicSettingsData.loopState);
    }

    async setLoopState(state: GuildMusicSettingsLoopState = "DISABLED") {
        this.updateDB("loopState", state);
        return this.updateCache("loopState", state);
    }

    get maxVolumeLimit(): number {
        return this.getCache("maxVolumeLimit", defaultGuildMusicFiltersSettingsData.volume);
    }

    async setMaxVolumeLimit(value: number) {
        if (value < 0 || value > 1000) throw new CustomError("VolumeLimit value must be between 0 and 1000");
        await this.updateDB("maxVolumeLimit", value);
        this.updateCache("maxVolumeLimit", value);
        return this;
    }
}

export interface GuildMusicSettingsData {
    loopState: GuildMusicSettingsLoopState,
    filters: GuildMusicFiltersSettingsData
}

export type GuildMusicSettingsLoopState = "DISABLED" | "QUEUE" | "TRACK";

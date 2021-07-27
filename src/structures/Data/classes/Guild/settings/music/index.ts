import DBUtils, { BaseData } from "../../../../DBUtils";
import { UpdateQuery } from "mongodb";
import dot from 'dot-prop';
import { Guild } from "../..";
import { GuildSettings, GuildSettingsData } from "..";
import { defaultGuildMusicFiltersSettingsData, GuildMusicFiltersManager, GuildMusicFiltersSettingsData } from "./GuildMusicFiltersManager";
import { CustomError } from "../../../../../Utils";

export const defaultGuildMusicSettingsData: GuildMusicSettingsData = {
    loopState: "DISABLED",
    filters: defaultGuildMusicFiltersSettingsData,
    stayConnected: false
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

    get stayConnected(): boolean {
        return this.getCache("stayConnected", defaultGuildMusicSettingsData.stayConnected);
    }

    async setStayConnected(value: boolean) {
        await this.updateDB("stayConnected", value);
        this.updateCache("stayConnected", value);
        return this;
    }
}

export interface GuildMusicSettingsData {
    loopState: GuildMusicSettingsLoopState,
    filters: GuildMusicFiltersSettingsData,
    stayConnected: boolean
}

export type GuildMusicSettingsLoopState = "DISABLED" | "QUEUE" | "TRACK";

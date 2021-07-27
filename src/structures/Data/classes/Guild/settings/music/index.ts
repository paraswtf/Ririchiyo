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
        if (state === defaultGuildMusicSettingsData.loopState) {
            await this.updateDB("loopState", null, "$unset");
            this.updateCache("loopState", null, "delete");
        }
        else {
            await this.updateDB("loopState", state);
            this.updateCache("loopState", state);
        }
        return this;
    }

    get stayConnected(): boolean {
        return this.getCache("stayConnected", defaultGuildMusicSettingsData.stayConnected);
    }

    async setStayConnected(value: boolean) {
        if (value === defaultGuildMusicSettingsData.stayConnected) {
            await this.updateDB("stayConnected", null, "$unset");
            this.updateCache("stayConnected", null, "delete");
        }
        else {
            await this.updateDB("stayConnected", value);
            this.updateCache("stayConnected", value);
        }
        return this;
    }
}

export interface GuildMusicSettingsData {
    loopState: GuildMusicSettingsLoopState,
    filters: GuildMusicFiltersSettingsData,
    stayConnected: boolean
}

export type GuildMusicSettingsLoopState = "DISABLED" | "QUEUE" | "TRACK";

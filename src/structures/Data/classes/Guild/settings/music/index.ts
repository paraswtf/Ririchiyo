import DBUtils, { BaseData } from "../../../../DBUtils";
import { Guild } from "../..";
import { GuildSettings } from "..";
import { defaultGuildMusicFiltersSettingsData, GuildMusicFiltersManager, GuildMusicFiltersSettingsData } from "./GuildMusicFiltersManager";

export const defaultGuildMusicSettingsData: GuildMusicSettingsData = {
    loopState: "DISABLED",
    filters: defaultGuildMusicFiltersSettingsData,
    stayConnected: false,
    autoPlay: false
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

    //Is premium feature so also check premium
    get stayConnected() {
        return this.getCache("stayConnected", defaultGuildMusicSettingsData.stayConnected) && this.guild.premium.isValid;
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

    //Is premium feature so also check premium
    get autoPlay() {
        return this.getCache("autoPlay", defaultGuildMusicSettingsData.autoPlay) && this.guild.premium.isValid;
    }

    async setAutoPlay(value: boolean) {
        if (value === defaultGuildMusicSettingsData.autoPlay) {
            await this.updateDB("autoPlay", null, "$unset");
            this.updateCache("autoPlay", null, "delete");
        }
        else {
            await this.updateDB("autoPlay", value);
            this.updateCache("autoPlay", value);
        }
        return this;
    }
}

export interface GuildMusicSettingsData {
    loopState: GuildMusicSettingsLoopState,
    filters: GuildMusicFiltersSettingsData,
    stayConnected: boolean,
    autoPlay: boolean
}

export type GuildMusicSettingsLoopState = "DISABLED" | "QUEUE" | "TRACK";

import { GuildMember } from "discord.js";
import Utils from "../Utils";
import Manager from "./LavalinkClient";

export type ThumbnailSize = | "0" | "1" | "2" | "3" | "default" | "mqdefault" | "hqdefault" | "maxresdefault";
export const THUMBNAIL_SIZES: ThumbnailSize[] = ["0", "1", "2", "3", "default", "mqdefault", "hqdefault", "maxresdefault"];

export const validateTrack = (track: any) => track && track instanceof Track;
export const validateTrackOrTrackArray = (track: any | any[]) => track && (validateTrack(track) || (Array.isArray(track) && track.every(t => validateTrack(t))));
export const escapeRegExp = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export class Track {
    manager: Manager;
    id: string;
    isResolved: boolean;
    data?: ResolvedTrackData;
    unresolvedTrackData?: UnresolvedTrackData;
    base64?: string;
    title?: string;
    channelName?: string;
    duration?: number;
    isSeekable?: boolean;
    isLive?: boolean;
    ytURL?: string;
    identifier?: string;
    displayTitle: string;
    displayOriginURL: string;
    displayURL: string;
    displayDuration: number;
    displayArtist: string;
    requester: GuildMember;

    constructor(manager: Manager, data: ResolvedTrackData | UnresolvedTrackData, requester: GuildMember) {
        this.manager = manager;
        this.id = Utils.snowflake.generate().toString();
        if ((data as ResolvedTrackData).info) {
            this.isResolved = true;
            this.data = data as ResolvedTrackData;
            this.base64 = this.data.track;
            this.title = this.data.info.title;
            this.channelName = this.data.info.author;
            this.duration = this.data.info.length;
            this.isSeekable = this.data.info.isSeekable;
            this.isLive = this.data.info.isStream;
            this.ytURL = this.data.info.uri;
            this.identifier = this.data.info.identifier;
            this.displayTitle = this.title;
            this.displayOriginURL = this.ytURL;
            this.displayURL = this.ytURL;
            this.displayDuration = this.duration;
            this.displayArtist = this.channelName;
        } else {
            this.isResolved = false;
            this.unresolvedTrackData = data as UnresolvedTrackData;
            this.displayTitle = this.unresolvedTrackData.title;
            this.displayOriginURL = this.unresolvedTrackData.originURL;
            this.displayURL = this.unresolvedTrackData.originURL;
            this.displayDuration = this.unresolvedTrackData.duration;
            this.displayArtist = this.unresolvedTrackData.artist;
        }
        this.requester = requester;
    }

    private resolveData(data: ResolvedTrackData) {
        this.data = data as ResolvedTrackData;
        this.base64 = data.track;
        this.title = data.info.title;
        this.channelName = data.info.author;
        this.duration = data.info.length;
        this.isSeekable = data.info.isSeekable;
        this.isLive = data.info.isStream;
        this.ytURL = data.info.uri;
        this.identifier = data.info.identifier;
        this.displayTitle = this.title;
        this.displayURL = this.ytURL;
        this.displayDuration = this.duration;
        this.displayArtist = this.channelName;
        this.isResolved = true;
    }

    displayThumbnail(size?: ThumbnailSize): string {
        return `https://img.youtube.com/vi/${this.identifier}/${size ? THUMBNAIL_SIZES.find((s) => s === size) ?? "default" : "default"}.jpg`
    };

    async resolve(): Promise<ResolvedTrack> {
        if (this.isResolved) return this as ResolvedTrack;
        const res = await this.manager.search(this.displayTitle + " - " + this.displayArtist, this.requester);

        if (res.loadType !== "SEARCH_RESULT") throw res.exception ?? {
            message: "No tracks found.",
            severity: "COMMON",
        };

        const channelNames = [this.displayArtist, `${this.displayArtist} - Topic`];

        const originalAudio = res.tracks.find(track => {
            return (
                channelNames.some(name => new RegExp(`^${escapeRegExp(name)}$`, "i").test(track.channelName)) ||
                new RegExp(`^${escapeRegExp(this.displayTitle)}$`, "i").test(track.title)
            );
        });

        if (originalAudio) {
            this.resolveData(originalAudio.data);
            return this as ResolvedTrack;
        }

        const sameDuration = res.tracks.find(track =>
            (track.duration >= (this.displayDuration - 1500)) &&
            (track.duration <= (this.displayDuration + 1500))
        );

        if (sameDuration) {
            this.resolveData(sameDuration.data);
            return this as ResolvedTrack;
        }

        this.resolveData(res.tracks[0].data);
        return this as ResolvedTrack;
    }
}

export type AnyTrack = ResolvedTrack | UnresolvedTrack;

export interface ResolvedTrack {
    manager: Manager;
    id: string;
    isResolved: true;
    data: ResolvedTrackData;
    unresolvedTrackData?: UnresolvedTrackData;
    base64: string;
    title: string;
    channelName: string;
    duration: number;
    isSeekable: boolean;
    isLive: boolean;
    ytURL: string;
    identifier: string;
    displayTitle: string;
    displayOriginURL: string;
    displayURL: string;
    displayDuration: number;
    displayArtist: string;
    requester: GuildMember;
    displayThumbnail(size?: ThumbnailSize): string;
}

export interface UnresolvedTrack {
    manager: Manager;
    id: string;
    isResolved: false;
    data: undefined;
    unresolvedTrackData: UnresolvedTrackData;
    base64: undefined;
    title: undefined;
    channelName: undefined;
    duration: undefined;
    isSeekable: undefined;
    isLive: undefined;
    ytURL: undefined;
    identifier: undefined;
    displayTitle: string;
    displayOriginURL: string;
    displayURL: string;
    displayDuration: number;
    displayArtist: string;
    requester: GuildMember;
    resolve(): Promise<ResolvedTrack>;
}

export interface ResolvedTrackData {
    /** The Base64 track data */
    track: string,
    /** Track Info */
    info: {
        /** Identifier on YouTube */
        identifier: string,
        /** Title of the video */
        title: string,
        /** The channel name who uploaded this video */
        author: string,
        /** Length in ms */
        length: number,
        /** Video URL on YouTube */
        uri: string
        /** If the track is seekable */
        isSeekable: boolean,
        /** If the video is a Live Stream */
        isStream: boolean,
        /** Position of the player - unnessacary */
        position: 0
    }
}

export interface UnresolvedTrackData {
    /** Title of the track to search */
    title: string,
    /** The artist who made this track */
    artist: string,
    /** Length in ms */
    duration: number,
    /** Video URL on YouTube */
    originURL: string
}

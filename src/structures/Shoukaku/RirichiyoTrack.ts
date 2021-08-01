import { GuildMember } from "discord.js";
import { ShoukakuTrack } from "shoukaku";
import Utils, { CustomError } from "../Utils";

export type ThumbnailSize = | "0" | "1" | "2" | "3" | "default" | "mqdefault" | "hqdefault" | "maxresdefault";
export const THUMBNAIL_SIZES: ThumbnailSize[] = ["0", "1", "2", "3", "default", "mqdefault", "hqdefault", "maxresdefault"];

export const validateTrack = (track: any) => track && track instanceof RirichiyoTrack;
export const validateTrackOrTrackArray = (track: any | any[]) => track && (validateTrack(track) || (Array.isArray(track) && track.every(t => validateTrack(t))));
export const escapeRegExp = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const maxTrackTitleDisplayLength = 39;


export class RirichiyoTrack {
    id: string;
    isResolved: boolean;
    data?: ShoukakuTrack;
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
    requester?: GuildMember;

    constructor(data: ShoukakuTrack | UnresolvedTrackData, requester?: GuildMember) {
        this.id = Utils.snowflake.generate().toString();
        if ((data as ShoukakuTrack).info) {
            this.isResolved = true;
            this.data = data as ShoukakuTrack;
            this.base64 = this.data.track;
            this.title = this.data.info.title;
            this.channelName = this.data.info.author;
            this.duration = this.data.info.length;
            this.isSeekable = this.data.info.isSeekable;
            this.isLive = this.data.info.isStream;
            this.ytURL = this.data.info.uri;
            this.identifier = this.data.info.identifier;
            this.displayTitle = Utils.escapeMarkdown(this.title!.length > maxTrackTitleDisplayLength ? this.title!.substring(0, maxTrackTitleDisplayLength) + "..." : this.title!);
            this.displayOriginURL = this.ytURL!;
            this.displayURL = this.ytURL!;
            this.displayDuration = this.duration!;
            this.displayArtist = this.channelName!;
        } else {
            this.isResolved = false;
            this.unresolvedTrackData = data as UnresolvedTrackData;
            this.displayTitle = Utils.escapeMarkdown(this.unresolvedTrackData.title.length > maxTrackTitleDisplayLength ? this.unresolvedTrackData.title.substring(0, maxTrackTitleDisplayLength) + "..." : this.unresolvedTrackData.title);
            this.displayOriginURL = this.unresolvedTrackData.originURL;
            this.displayURL = this.unresolvedTrackData.originURL;
            this.displayDuration = this.unresolvedTrackData.duration;
            this.displayArtist = this.unresolvedTrackData.artist;
        }
        this.requester = requester;
    }

    private resolveData(data: ShoukakuTrack) {
        this.data = data;
        this.base64 = data.track;
        this.title = data.info.title;
        this.channelName = data.info.author;
        this.duration = data.info.length;
        this.isSeekable = data.info.isSeekable;
        this.isLive = data.info.isStream;
        this.ytURL = data.info.uri;
        this.identifier = data.info.identifier;
        this.displayTitle = Utils.escapeMarkdown(this.title!.length > maxTrackTitleDisplayLength ? this.title!.substring(0, maxTrackTitleDisplayLength) + "..." : this.title!);
        this.displayURL = this.ytURL!;
        this.displayDuration = this.duration!;
        this.displayArtist = this.channelName!;
        this.isResolved = true;
    }

    displayThumbnail(size?: ThumbnailSize): string {
        return `https://img.youtube.com/vi/${this.identifier}/${size ? THUMBNAIL_SIZES.find((s) => s === size) ?? "default" : "default"}.jpg`
    };

    async resolve(): Promise<ResolvedTrack> {
        if (this.isResolved) return this as ResolvedTrack;
        const res = await Utils.client.shoukaku.getNode().rest.resolve((this as UnresolvedTrack).unresolvedTrackData.title + " - " + (this as UnresolvedTrack).unresolvedTrackData.artist, "youtube");

        if (!res || res.type !== "SEARCH") throw new CustomError("No tracks found matching the query to resolve the track.");

        const channelNames = [/*this.displayArtist,*/ `${this.displayArtist} - Topic`];

        const originalAudio = res.tracks.find(track => {
            if (track.info.author) {
                return channelNames.some(name => new RegExp(`^${escapeRegExp(name)}$`, "i").test(track.info.author!));
            } else if (track.info.title) {
                return new RegExp(`^${escapeRegExp((this as UnresolvedTrack).unresolvedTrackData.title)}$`, "i").test(track.info.title);
            } else return false;
        });

        if (originalAudio) {
            this.resolveData(originalAudio);
            return this as ResolvedTrack;
        }

        const sameDuration = res.tracks.find(track =>
            (track.info.length || 0 >= (this.displayDuration - 1500)) &&
            (track.info.length || 0 <= (this.displayDuration + 1500))
        );

        if (sameDuration) {
            this.resolveData(sameDuration);
            return this as ResolvedTrack;
        }

        this.resolveData(res.tracks[0]);
        return this as ResolvedTrack;
    }
}

export type AnyTrack = ResolvedTrack | UnresolvedTrack;
export interface ResolvedTrack {
    id: string;
    isResolved: true;
    data: ShoukakuTrack;
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

export interface UnresolvedTrackData {
    /** Title of the track to search */
    title: string,
    /** The artist who made this track */
    artist: string,
    /** Length in ms */
    duration: number,
    /** Spotify/Soundcloud/YouTube URL on YouTube */
    originURL: string
}

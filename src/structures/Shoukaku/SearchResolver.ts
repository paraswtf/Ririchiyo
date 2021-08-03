import { KSoftClient } from "@ksoft/api";
import { GuildMember } from "discord.js";
import { Spotify, SpotifyOptions, spotifyRegex } from "../Spotify";
import Utils from "../Utils";
import { ResourcePart, YouTube } from "../YouTube";
import { AnyTrack, RirichiyoTrack } from "./RirichiyoTrack";
const replacements: Record<string, string> = {
    '&': "and"
}

const youtubeRegex = /^(?:https?:\/\/)(?:www)?\.?(?:youtu\.?be)(?:\.com)?\//;

export class SearchResolver {
    /** Class props */
    readonly client = Utils.client;
    readonly youtube: YouTube;
    readonly spotify: Spotify;
    readonly ksoft: KSoftClient;

    constructor({ youtubeKey, spotify, ksoftToken }: SearchResolverOptions) {
        this.youtube = new YouTube(youtubeKey);
        this.spotify = new Spotify(spotify);
        this.ksoft = new KSoftClient(ksoftToken);
    }

    /**
     * Parse user input
     */
    static parseUrl(input: string): ParseUrlResult | null {
        //If spotify regex matched
        if (spotifyRegex.test(input)) return { provider: 'SPOTIFY', url: input };
        if (youtubeRegex.test(input)) return { provider: 'YOUTUBE', url: input };
        return null
    }

    static parseQuery(query: string) {
        return query.replace(/[\&]/g, m => replacements[m]);
    }

    /**
     * Search the video and get the url from youtube
     */
    async fetchVideoURL(query: string) {
        const res = await this.youtube.searchVideos(SearchResolver.parseQuery(query), 1, { part: ResourcePart.video, safeSearch: "moderate" }).catch(console.error);
        if (!res || !res[0]?.id) return null;
        return "https://www.youtube.com/watch?v=" + res[0].id;
    }

    /**
     * Search a track or url
     */
    async search(options: SearchOptions): Promise<SearchResolverResult | null> {
        let parsedUrl = options.isQuery ? null : SearchResolver.parseUrl(options.query);
        if (!parsedUrl) {
            const url = await this.fetchVideoURL(options.query);
            if (!url) return null;

            //After getting the url, set the provider to youtube and set the query to url
            parsedUrl = { provider: "YOUTUBE", url: url };
        }

        if (parsedUrl.provider) {
            switch (parsedUrl.provider) {
                case "YOUTUBE": {
                    const res = await this.client.shoukaku.getNode().rest.resolve(parsedUrl.url);
                    if (!res) return null;

                    switch (res.type) {
                        case "PLAYLIST": return {
                            provider: parsedUrl.provider,
                            type: res.type,
                            playlistName: res.playlistName!,
                            tracks: res.tracks.map(d => new RirichiyoTrack(d, options.requester) as AnyTrack),
                            playlistUrl: parsedUrl.url
                        }
                        case "TRACK": return {
                            provider: parsedUrl.provider,
                            type: res.type,
                            tracks: res.tracks.map(d => new RirichiyoTrack(d, options.requester) as AnyTrack),
                        }
                        default: return null;
                    }
                }
                case "SPOTIFY": {
                    const res = await this.spotify.get(parsedUrl.url);
                    if (!res) return null;

                    switch (res.type) {
                        case "PLAYLIST": return {
                            provider: parsedUrl.provider,
                            type: res.type,
                            playlistName: res.playlistName,
                            playlistUrl: res.playlistURL,
                            tracks: res.tracks.map(d => new RirichiyoTrack(d, options.requester) as AnyTrack)
                        }
                        case "TRACK": return {
                            provider: parsedUrl.provider,
                            type: res.type,
                            tracks: res.tracks.map(d => new RirichiyoTrack(d, options.requester) as AnyTrack)
                        }
                        case "ALBUM": return {
                            provider: parsedUrl.provider,
                            type: res.type,
                            tracks: res.tracks.map(d => new RirichiyoTrack(d, options.requester) as AnyTrack),
                            playlistName: res.albumName,
                            playlistUrl: res.albumURL
                        }
                        case "ARTIST": return {
                            provider: parsedUrl.provider,
                            type: res.type,
                            tracks: res.tracks.map(d => new RirichiyoTrack(d, options.requester) as AnyTrack),
                            playlistName: res.artistName,
                            playlistUrl: res.artistURL
                        }
                        default: return null;
                    }
                }
            }
        }

        return null;
    }
}

/**
 * Input Types
 */
export interface SearchResolverOptions {
    youtubeKey: string;
    spotify: SpotifyOptions;
    ksoftToken: string;
}

export interface SearchOptions {
    //Can be any url or string
    query: string;
    requester?: GuildMember;
    isQuery?: boolean;
}


/**
 * Result Types
 */
export interface ParseUrlResult {
    provider: SearchProvider;
    url: string;
}

export type SearchProvider = 'SPOTIFY' | 'YOUTUBE';
export type ResultType = 'TRACK' | 'PLAYLIST' | 'ALBUM' | 'ARTIST' | 'RADIO';

export interface BaseSearchResolverResult {
    provider: SearchProvider;
    type: ResultType;
    tracks: AnyTrack[];
}

export interface BaseSpotifyResolveResult extends BaseSearchResolverResult {
    provider: 'SPOTIFY';
    type: ResultType;
    tracks: AnyTrack[];
}

export interface TrackSpotifyResolveResult extends BaseSpotifyResolveResult {
    type: 'TRACK';
    tracks: AnyTrack[];
    playlistName?: undefined,
    playlistUrl?: undefined
}

export interface PlaylistOrAlbumSpotifyResolveResult extends BaseSpotifyResolveResult {
    type: 'PLAYLIST' | 'ALBUM' | 'ARTIST';
    tracks: AnyTrack[];
    playlistName: string,
    playlistUrl: string
}

export interface BaseYoutubeResolveResult extends BaseSearchResolverResult {
    provider: 'YOUTUBE';
    type: ResultType;
    tracks: AnyTrack[];
}

export interface TrackYoutubeResolveResult extends BaseYoutubeResolveResult {
    type: 'TRACK';
    playlistName?: undefined;
    playlistUrl?: undefined
}

export interface PlaylistYoutubeResolveResult extends BaseYoutubeResolveResult {
    type: 'PLAYLIST';
    playlistName: string;
    playlistUrl: string;
}

export type SearchResolverResult =
    | TrackSpotifyResolveResult
    | PlaylistOrAlbumSpotifyResolveResult
    | TrackYoutubeResolveResult
    | PlaylistYoutubeResolveResult;

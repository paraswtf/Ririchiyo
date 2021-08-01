import Axios from "axios";
import { UnresolvedTrackData } from "./Shoukaku/RirichiyoTrack";
import { parse } from 'spotify-uri';
import Utils from "./Utils";
const spotifyRegex = /^(?:https:\/\/(?:(?:open|www)\.)?spotify\.com\/|spotify:)(?:.+)?(?<type>track|playlist|album)[\/:](?<id>[A-Za-z0-9]{22})/;

const BASE_URL = "https://api.spotify.com/v1";

export class Spotify {
    readonly client = Utils.client;
    private readonly authorization: string;
    private readonly token: { key?: string, expiresAt: number } = { expiresAt: 0 };
    private readonly axiosOptions: { headers: { Authorization?: string; "Content-Type": string } };
    private readonly options: SpotifyOptions;
    private readonly fetchMethods: Record<string, Function>;

    constructor(options: SpotifyOptions) {
        this.options = {
            ...options
        }
        this.authorization = Buffer.from(`${this.options.clientID}:${this.options.secret}`).toString("base64");
        this.axiosOptions = { headers: { "Content-Type": "application/json", Authorization: this.token.key } };
        this.fetchMethods = {
            track: this.getTrack.bind(this),
            playlist: this.getPlaylist.bind(this),
            album: this.getAlbum.bind(this)
        }
    }

    /**
     * Renew token method, runs internally on expiry
     */
    private async refreshToken() {
        if (Date.now() < this.token.expiresAt) return;

        const { data: { access_token, expires_in } } = await Axios.post(
            "https://accounts.spotify.com/api/token",
            "grant_type=client_credentials",
            { headers: { Authorization: `Basic ${this.authorization}`, "Content-Type": "application/x-www-form-urlencoded" } }
        ).catch(this.client.logger.error) || {};
        if (!access_token) throw new Error("Invalid Spotify client.");

        this.token.key = `Bearer ${access_token}`;
        this.token.expiresAt = Date.now() + (expires_in * 1000) - (10 * 1000);
        this.axiosOptions.headers.Authorization = this.token.key;
    }

    /**
     * Comvert spotify track data to unresolved tracks
     */
    private static track(data: SpotifyTrack,): UnresolvedTrackData {
        return {
            title: data.name,
            artist: data.artists[0].name,
            duration: data.duration_ms,
            originURL: data.external_urls.spotify
        };
    }

    /**
     * Search basically anything
     */
    async get(url: string): Promise<SpotifyResult | null> {
        if (Date.now() >= this.token.expiresAt) await this.refreshToken();
        const { groups: parsed } = url.match(spotifyRegex) ?? {};
        if (parsed?.id && parsed.type && this.fetchMethods[parsed.type]) return this.fetchMethods[parsed.type](parsed.id).catch(this.client.logger.error) ?? null;
        return null;
    }

    /**
     * Get a playlist using id
     */
    async getPlaylist(id: string): Promise<ResultPlaylist> {
        let { data: playlist } = await Axios.get<Playlist>(`${BASE_URL}/playlists/${id}`, this.axiosOptions);
        const tracks = playlist.tracks.items.map(item => Spotify.track(item.track));
        let next = playlist.tracks.next, page = 1;

        while (next && (!this.options.playlistLimit ? true : page < this.options.playlistLimit)) {
            const { data: nextPage } = await Axios.get<PlaylistTracks>(next, this.axiosOptions);
            tracks.push(...nextPage.items.map(item => Spotify.track(item.track)));
            next = nextPage.next;
            page++;
        }

        return {
            provider: 'SPOTIFY',
            type: 'PLAYLIST',
            tracks,
            playlistName: playlist.name,
            playlistURL: playlist.external_urls.spotify
        };
    }

    /**
     * Get an album using id
     */
    async getAlbum(id: string): Promise<ResultAlbum> {
        const { data: album } = await Axios.get<Album>(`${BASE_URL}/albums/${id}`, this.axiosOptions);
        const tracks = album.tracks.items.map(item => Spotify.track(item));
        let next = album.tracks.next, page = 1;

        while (next && (!this.options.albumLimit ? true : page < this.options.albumLimit)) {
            const { data: nextPage } = await Axios.get<AlbumTracks>(next, this.axiosOptions);
            tracks.push(...nextPage.items.map(item => Spotify.track(item)));
            next = nextPage.next;
            page++;
        }

        return {
            provider: 'SPOTIFY',
            type: 'ALBUM',
            tracks,
            playlistName: album.name,
            playlistURL: album.external_urls.spotify
        };
    }

    /**
     * Get a track using id
     */
    async getTrack(id: string): Promise<ResultTrack> {
        const { data } = await Axios.get<SpotifyTrack>(`${BASE_URL}/tracks/${id}`, this.axiosOptions);
        return {
            provider: 'SPOTIFY',
            type: 'TRACK',
            tracks: [Spotify.track(data)]
        };
    }
}

export interface SpotifyOptions {
    clientID: string;
    secret: string;
    /** Amount of pages to load, each page having 100 tracks. */
    playlistLimit?: number
    /** Amount of pages to load, each page having 50 tracks. */
    albumLimit?: number
}
export type SpotifyResult =
    | ResultTrack
    | ResultPlaylist
    | ResultAlbum;
export interface BaseSpotifyResult {
    provider: 'SPOTIFY';
    type: 'TRACK' | 'PLAYLIST' | 'ALBUM';
}
export interface ResultTrack extends BaseSpotifyResult {
    type: 'TRACK';
    tracks: UnresolvedTrackData[];
}
export interface ResultPlaylist extends BaseSpotifyResult {
    type: 'PLAYLIST';
    playlistName: string;
    playlistURL: string;
    tracks: UnresolvedTrackData[];
}
export interface ResultAlbum extends BaseSpotifyResult {
    type: 'ALBUM';
    playlistName: string;
    playlistURL: string;
    tracks: UnresolvedTrackData[];
}

//Spotify API data types
export interface Album {
    name: string;
    tracks: AlbumTracks;
    external_urls: {
        spotify: string
    }
}
export interface AlbumTracks {
    items: SpotifyTrack[];
    next: string | null;
}
export interface Artist {
    name: string;
}
export interface ArtistTracks {
    tracks: SpotifyTrack[]
}
export interface Playlist {
    tracks: PlaylistTracks;
    name: string;
    external_urls: {
        spotify: string
    }
}
export interface PlaylistTracks {
    items: [
        {
            track: SpotifyTrack;
        }
    ];
    next: string | null;
}
export interface SpotifyTrack {
    artists: Artist[];
    name: string;
    duration_ms: number;
    external_urls: {
        spotify: string
    }
}

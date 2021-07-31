import Axios from "axios";
import { GuildMember } from "discord.js";
import { RirichiyoTrack, UnresolvedTrack } from "../Shoukaku/RirichiyoTrack";
import { parse } from 'spotify-uri';
export const SpotifyRegex = /^(?:https:\/\/(?:(open|www)\.)?spotify\.com\/|spotify:)(?:.+)?(track|playlist|album)[\/:]([A-Za-z0-9]+)/;

const BASE_URL = "https://api.spotify.com/v1";

export class Spotify {
    private readonly authorization: string;
    private token?: string;
    private readonly axiosOptions: { headers: { Authorization?: string; "Content-Type": string } };
    private readonly options: SpotifyOptions;
    private readonly fetchMethods: Record<string, Function>;

    constructor(options: SpotifyOptions) {
        this.options = {
            ...options
        }
        this.authorization = Buffer.from(`${this.options.clientID}:${this.options.clientSecret}`).toString("base64");
        this.axiosOptions = { headers: { "Content-Type": "application/json", Authorization: this.token } };
        this.fetchMethods = {
            track: this.getTrack.bind(this),
            playlist: this.getPlaylist.bind(this),
            album: this.getAlbum.bind(this)
        }
    }

    /**
     * Login to spotify and get a auth token
     */
    async login() {
        const expiry = await this.renewToken() ?? null;
        if (expiry !== null) setTimeout(this.renewAndSetTimeout.bind(this), expiry);
        return expiry;
    }

    /**
     * Renew token method, runs internally on expiry
     */
    private async renewToken(): Promise<number> {
        const { data: { access_token, expires_in } } = await Axios.post(
            "https://accounts.spotify.com/api/token",
            "grant_type=client_credentials",
            { headers: { Authorization: `Basic ${this.authorization}`, "Content-Type": "application/x-www-form-urlencoded" } }
        );
        if (!access_token) throw new Error("Invalid Spotify client.");
        this.token = `Bearer ${access_token}`;
        this.axiosOptions.headers.Authorization = this.token;
        return expires_in - 10 * 1000;
    }
    private async renewAndSetTimeout(): Promise<void> { setTimeout(this.renewAndSetTimeout.bind(this), await this.renewToken()); }

    /**
     * Comvert spotify track data to unresolved tracks
     */
    private static convertSpotifyTrackToUnresolved(data: SpotifyTrack, requester: GuildMember) {
        return new RirichiyoTrack({
            title: data.name,
            artist: data.artists[0].name,
            duration: data.duration_ms,
            originURL: data.external_urls.spotify
        }, requester) as UnresolvedTrack;
    }

    /**
     * Search basically anything
     */
    async getRes(input: string, requester: GuildMember): Promise<ResultTrack | ResultPlaylist | ResultAlbum | null> {
        const parsed = parse(input) as any;
        if (!parsed || !parsed.type || !parsed.id) return null;
        if (this.fetchMethods[parsed.type]) return this.fetchMethods[parsed.type](parsed.id, requester);
        return null;
    }

    /**
     * Get a playlist using id
     */
    async getPlaylist(id: string, requester: GuildMember): Promise<ResultPlaylist> {
        let { data: playlist } = await Axios.get<Playlist>(`${BASE_URL}/playlists/${id}`, this.axiosOptions);
        const tracks = playlist.tracks.items.map(item => Spotify.convertSpotifyTrackToUnresolved(item.track, requester));
        let next = playlist.tracks.next, page = 1;

        while (next && (!this.options.playlistLimit ? true : page < this.options.playlistLimit)) {
            const { data: nextPage } = await Axios.get<PlaylistTracks>(next, this.axiosOptions);
            tracks.push(...nextPage.items.map(item => Spotify.convertSpotifyTrackToUnresolved(item.track, requester)));
            next = nextPage.next;
            page++;
        }

        return {
            type: 'PLAYLIST',
            tracks,
            playlistName: playlist.name,
            playlistURL: playlist.external_urls.spotify
        };
    }

    /**
     * Get an album using id
     */
    async getAlbum(id: string, requester: GuildMember): Promise<ResultAlbum> {
        const { data: album } = await Axios.get<Album>(`${BASE_URL}/albums/${id}`, this.axiosOptions);
        const tracks = album.tracks.items.map(item => Spotify.convertSpotifyTrackToUnresolved(item, requester));
        let next = album.tracks.next, page = 1;

        while (next && (!this.options.albumLimit ? true : page < this.options.albumLimit)) {
            const { data: nextPage } = await Axios.get<AlbumTracks>(next, this.axiosOptions);
            tracks.push(...nextPage.items.map(item => Spotify.convertSpotifyTrackToUnresolved(item, requester)));
            next = nextPage.next;
            page++;
        }

        return {
            type: 'ALBUM',
            tracks,
            playlistName: album.name,
            playlistURL: album.external_urls.spotify
        };
    }

    /**
     * Get a track using id
     */
    async getTrack(id: string, requester: GuildMember): Promise<ResultTrack> {
        const { data } = await Axios.get<SpotifyTrack>(`${BASE_URL}/tracks/${id}`, this.axiosOptions);
        const track = Spotify.convertSpotifyTrackToUnresolved(data, requester);
        return {
            type: 'TRACK',
            tracks: [track]
        };
    }
}

export interface SpotifyOptions {
    clientID: string;
    clientSecret: string;
    /** Amount of pages to load, each page having 100 tracks. */
    playlistLimit?: number
    /** Amount of pages to load, each page having 50 tracks. */
    albumLimit?: number
}
export interface ResultTrack {
    type: 'TRACK';
    tracks: UnresolvedTrack[];
}
export interface ResultPlaylist {
    type: 'PLAYLIST';
    playlistName: string;
    playlistURL: string;
    tracks: UnresolvedTrack[];
}
export interface ResultAlbum {
    type: 'ALBUM';
    playlistName: string;
    playlistURL: string;
    tracks: UnresolvedTrack[];
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

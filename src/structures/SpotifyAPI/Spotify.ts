import Axios from "axios";
import { UnresolvedTrackData } from "../Shoukaku/RirichiyoTrack";
import Utils, { DefinedCollection } from "../Utils";
export const spotifyRegex = /^(?:https:\/\/(?:(?:open|www)\.)?spotify\.com\/|spotify:)(?:.+)?(?<type>track|playlist|album|artist)[\/:](?<id>[A-Za-z0-9]{22})/;

const BASE_URL = "https://api.spotify.com/v1";

const regions = new DefinedCollection<DiscorVoiceRegionID, SpotifyMarket>([
    ['amsterdam', 'NL'],
    ['atlanta', 'GE'],
    ['brazil', 'BR'],
    ['buenos-aires', 'AR'],
    ['dubai', 'AE'],
    ['eu-central', 'EU'],
    ['eu-west', 'EU'],
    ['europe', 'EU'],
    ['frankfurt', 'DE'],
    ['hongkong', 'HK'],
    ['india', 'IN'],
    ['japan', 'JP'],
    ['london', 'UK'],
    ['newark', 'US'],
    ['russia', 'RU'],
    ['santiago', 'CL'],
    ['singapore', 'SG'],
    ['southafrica', 'ZA'],
    ['st-pete', 'RU'],
    ['staff', 'US'],
    ['sydney', 'AU'],
    ['us-central', 'US'],
    ['us-east', 'US'],
    ['us-west', 'US']
]);

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
            album: this.getAlbum.bind(this),
            artist: this.getArtistTopTracks.bind(this)
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
    private static track(data: SpotifyTrack): UnresolvedTrackData {
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
    async get(url: string, region: DiscorVoiceRegionID | SpotifyMarket = "india"): Promise<SpotifyResult | null> {
        if (Date.now() >= this.token.expiresAt) await this.refreshToken();
        const { groups: parsed } = url.match(spotifyRegex) ?? {};
        if (parsed?.id && parsed.type && this.fetchMethods[parsed.type]) return this.fetchMethods[parsed.type](parsed.id, region).catch(this.client.logger.error) ?? null;
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
            albumName: album.name,
            albumURL: album.external_urls.spotify
        };
    }

    /**
     * Get an album using id
     */
    async getArtistTopTracks(id: string, region: SpotifyMarket | DiscorVoiceRegionID): Promise<ResultArtistTopTracks> {
        if (regions.has(region as DiscorVoiceRegionID)) region = regions.get(region as DiscorVoiceRegionID);
        const { data: artistTopTracks } = await Axios.get<ArtistTopTracks>(`${BASE_URL}/artists/${id}/top-tracks?market=${region}`, this.axiosOptions);
        const tracks = artistTopTracks.tracks.map(item => Spotify.track(item));
        return {
            provider: 'SPOTIFY',
            type: 'ARTIST',
            tracks,
            artistName: artistTopTracks.tracks[0].artists[0].name,
            artistURL: artistTopTracks.tracks[0].artists[0].external_urls.spotify
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
    | ResultAlbum
    | ResultArtistTopTracks;
export interface BaseSpotifyResult {
    provider: 'SPOTIFY';
    type: 'TRACK' | 'PLAYLIST' | 'ALBUM' | 'ARTIST';
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
    albumName: string;
    albumURL: string;
    tracks: UnresolvedTrackData[];
}
export interface ResultArtistTopTracks extends BaseSpotifyResult {
    type: 'ARTIST';
    artistName: string;
    artistURL: string;
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
    external_urls: {
        spotify: string
    }
}
export interface ArtistTopTracks {
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

export type DiscorVoiceRegionID =
    | 'us-west'
    | 'us-east'
    | 'us-central'
    | 'singapore'
    | 'southafrica'
    | 'sydney'
    | 'europe'
    | 'brazil'
    | 'hongkong'
    | 'russia'
    | 'japan'
    | 'india'
    | 'dubai'
    | 'atlanta'
    | 'newark'
    | 'st-pete'
    | 'santiago'
    | 'buenos-aires'
    | 'amsterdam'
    | 'london'
    | 'frankfurt'
    | 'eu-central'
    | 'eu-west'
    | 'staff'

export type SpotifyMarket =
    | 'AA'
    | 'AB'
    | 'AC'
    | 'AD'
    | 'AE'
    | 'AF'
    | 'AG'
    | 'AH'
    | 'AI'
    | 'AJ'
    | 'AK'
    | 'AL'
    | 'AM'
    | 'AN'
    | 'AO'
    | 'AP'
    | 'AQ'
    | 'AR'
    | 'AS'
    | 'AT'
    | 'AU'
    | 'AV'
    | 'AW'
    | 'AX'
    | 'AY'
    | 'AZ'
    | 'BA'
    | 'BB'
    | 'BC'
    | 'BD'
    | 'BE'
    | 'BF'
    | 'BG'
    | 'BH'
    | 'BI'
    | 'BJ'
    | 'BK'
    | 'BL'
    | 'BM'
    | 'BN'
    | 'BO'
    | 'BP'
    | 'BQ'
    | 'BR'
    | 'BS'
    | 'BT'
    | 'BU'
    | 'BV'
    | 'BW'
    | 'BX'
    | 'BY'
    | 'BZ'
    | 'CA'
    | 'CB'
    | 'CC'
    | 'CD'
    | 'CE'
    | 'CF'
    | 'CG'
    | 'CH'
    | 'CI'
    | 'CJ'
    | 'CK'
    | 'CL'
    | 'CM'
    | 'CN'
    | 'CO'
    | 'CP'
    | 'CQ'
    | 'CR'
    | 'CS'
    | 'CT'
    | 'CU'
    | 'CV'
    | 'CW'
    | 'CX'
    | 'CY'
    | 'CZ'
    | 'DA'
    | 'DB'
    | 'DC'
    | 'DD'
    | 'DE'
    | 'DF'
    | 'DG'
    | 'DH'
    | 'DI'
    | 'DJ'
    | 'DK'
    | 'DL'
    | 'DM'
    | 'DN'
    | 'DO'
    | 'DP'
    | 'DQ'
    | 'DR'
    | 'DS'
    | 'DT'
    | 'DU'
    | 'DV'
    | 'DW'
    | 'DX'
    | 'DY'
    | 'DZ'
    | 'EA'
    | 'EB'
    | 'EC'
    | 'ED'
    | 'EE'
    | 'EF'
    | 'EG'
    | 'EH'
    | 'EI'
    | 'EJ'
    | 'EK'
    | 'EL'
    | 'EM'
    | 'EN'
    | 'EO'
    | 'EP'
    | 'EQ'
    | 'ER'
    | 'ES'
    | 'ET'
    | 'EU'
    | 'EV'
    | 'EW'
    | 'EX'
    | 'EY'
    | 'EZ'
    | 'FA'
    | 'FB'
    | 'FC'
    | 'FD'
    | 'FE'
    | 'FF'
    | 'FG'
    | 'FH'
    | 'FI'
    | 'FJ'
    | 'FK'
    | 'FL'
    | 'FM'
    | 'FN'
    | 'FO'
    | 'FP'
    | 'FQ'
    | 'FR'
    | 'FS'
    | 'FT'
    | 'FU'
    | 'FV'
    | 'FW'
    | 'FX'
    | 'FY'
    | 'FZ'
    | 'GA'
    | 'GB'
    | 'GC'
    | 'GD'
    | 'GE'
    | 'GF'
    | 'GG'
    | 'GH'
    | 'GI'
    | 'GJ'
    | 'GK'
    | 'GL'
    | 'GM'
    | 'GN'
    | 'GO'
    | 'GP'
    | 'GQ'
    | 'GR'
    | 'GS'
    | 'GT'
    | 'GU'
    | 'GV'
    | 'GW'
    | 'GX'
    | 'GY'
    | 'GZ'
    | 'HA'
    | 'HB'
    | 'HC'
    | 'HD'
    | 'HE'
    | 'HF'
    | 'HG'
    | 'HH'
    | 'HI'
    | 'HJ'
    | 'HK'
    | 'HL'
    | 'HM'
    | 'HN'
    | 'HO'
    | 'HP'
    | 'HQ'
    | 'HR'
    | 'HS'
    | 'HT'
    | 'HU'
    | 'HV'
    | 'HW'
    | 'HX'
    | 'HY'
    | 'HZ'
    | 'IA'
    | 'IB'
    | 'IC'
    | 'ID'
    | 'IE'
    | 'IF'
    | 'IG'
    | 'IH'
    | 'II'
    | 'IJ'
    | 'IK'
    | 'IL'
    | 'IM'
    | 'IN'
    | 'IO'
    | 'IP'
    | 'IQ'
    | 'IR'
    | 'IS'
    | 'IT'
    | 'IU'
    | 'IV'
    | 'IW'
    | 'IX'
    | 'IY'
    | 'IZ'
    | 'JA'
    | 'JB'
    | 'JC'
    | 'JD'
    | 'JE'
    | 'JF'
    | 'JG'
    | 'JH'
    | 'JI'
    | 'JJ'
    | 'JK'
    | 'JL'
    | 'JM'
    | 'JN'
    | 'JO'
    | 'JP'
    | 'JQ'
    | 'JR'
    | 'JS'
    | 'JT'
    | 'JU'
    | 'JV'
    | 'JW'
    | 'JX'
    | 'JY'
    | 'JZ'
    | 'KA'
    | 'KB'
    | 'KC'
    | 'KD'
    | 'KE'
    | 'KF'
    | 'KG'
    | 'KH'
    | 'KI'
    | 'KJ'
    | 'KK'
    | 'KL'
    | 'KM'
    | 'KN'
    | 'KO'
    | 'KP'
    | 'KQ'
    | 'KR'
    | 'KS'
    | 'KT'
    | 'KU'
    | 'KV'
    | 'KW'
    | 'KX'
    | 'KY'
    | 'KZ'
    | 'LA'
    | 'LB'
    | 'LC'
    | 'LD'
    | 'LE'
    | 'LF'
    | 'LG'
    | 'LH'
    | 'LI'
    | 'LJ'
    | 'LK'
    | 'LL'
    | 'LM'
    | 'LN'
    | 'LO'
    | 'LP'
    | 'LQ'
    | 'LR'
    | 'LS'
    | 'LT'
    | 'LU'
    | 'LV'
    | 'LW'
    | 'LX'
    | 'LY'
    | 'LZ'
    | 'MA'
    | 'MB'
    | 'MC'
    | 'MD'
    | 'ME'
    | 'MF'
    | 'MG'
    | 'MH'
    | 'MI'
    | 'MJ'
    | 'MK'
    | 'ML'
    | 'MM'
    | 'MN'
    | 'MO'
    | 'MP'
    | 'MQ'
    | 'MR'
    | 'MS'
    | 'MT'
    | 'MU'
    | 'MV'
    | 'MW'
    | 'MX'
    | 'MY'
    | 'MZ'
    | 'NA'
    | 'NB'
    | 'NC'
    | 'ND'
    | 'NE'
    | 'NF'
    | 'NG'
    | 'NH'
    | 'NI'
    | 'NJ'
    | 'NK'
    | 'NL'
    | 'NM'
    | 'NN'
    | 'NO'
    | 'NP'
    | 'NQ'
    | 'NR'
    | 'NS'
    | 'NT'
    | 'NU'
    | 'NV'
    | 'NW'
    | 'NX'
    | 'NY'
    | 'NZ'
    | 'OA'
    | 'OB'
    | 'OC'
    | 'OD'
    | 'OE'
    | 'OF'
    | 'OG'
    | 'OH'
    | 'OI'
    | 'OJ'
    | 'OK'
    | 'OL'
    | 'OM'
    | 'ON'
    | 'OO'
    | 'OP'
    | 'OQ'
    | 'OR'
    | 'OS'
    | 'OT'
    | 'OU'
    | 'OV'
    | 'OW'
    | 'OX'
    | 'OY'
    | 'OZ'
    | 'PA'
    | 'PB'
    | 'PC'
    | 'PD'
    | 'PE'
    | 'PF'
    | 'PG'
    | 'PH'
    | 'PI'
    | 'PJ'
    | 'PK'
    | 'PL'
    | 'PM'
    | 'PN'
    | 'PO'
    | 'PP'
    | 'PQ'
    | 'PR'
    | 'PS'
    | 'PT'
    | 'PU'
    | 'PV'
    | 'PW'
    | 'PX'
    | 'PY'
    | 'PZ'
    | 'QA'
    | 'QB'
    | 'QC'
    | 'QD'
    | 'QE'
    | 'QF'
    | 'QG'
    | 'QH'
    | 'QI'
    | 'QJ'
    | 'QK'
    | 'QL'
    | 'QM'
    | 'QN'
    | 'QO'
    | 'QP'
    | 'QQ'
    | 'QR'
    | 'QS'
    | 'QT'
    | 'QU'
    | 'QV'
    | 'QW'
    | 'QX'
    | 'QY'
    | 'QZ'
    | 'RA'
    | 'RB'
    | 'RC'
    | 'RD'
    | 'RE'
    | 'RF'
    | 'RG'
    | 'RH'
    | 'RI'
    | 'RJ'
    | 'RK'
    | 'RL'
    | 'RM'
    | 'RN'
    | 'RO'
    | 'RP'
    | 'RQ'
    | 'RR'
    | 'RS'
    | 'RT'
    | 'RU'
    | 'RV'
    | 'RW'
    | 'RX'
    | 'RY'
    | 'RZ'
    | 'SA'
    | 'SB'
    | 'SC'
    | 'SD'
    | 'SE'
    | 'SF'
    | 'SG'
    | 'SH'
    | 'SI'
    | 'SJ'
    | 'SK'
    | 'SL'
    | 'SM'
    | 'SN'
    | 'SO'
    | 'SP'
    | 'SQ'
    | 'SR'
    | 'SS'
    | 'ST'
    | 'SU'
    | 'SV'
    | 'SW'
    | 'SX'
    | 'SY'
    | 'SZ'
    | 'TA'
    | 'TB'
    | 'TC'
    | 'TD'
    | 'TE'
    | 'TF'
    | 'TG'
    | 'TH'
    | 'TI'
    | 'TJ'
    | 'TK'
    | 'TL'
    | 'TM'
    | 'TN'
    | 'TO'
    | 'TP'
    | 'TQ'
    | 'TR'
    | 'TS'
    | 'TT'
    | 'TU'
    | 'TV'
    | 'TW'
    | 'TX'
    | 'TY'
    | 'TZ'
    | 'UA'
    | 'UB'
    | 'UC'
    | 'UD'
    | 'UE'
    | 'UF'
    | 'UG'
    | 'UH'
    | 'UI'
    | 'UJ'
    | 'UK'
    | 'UL'
    | 'UM'
    | 'UN'
    | 'UO'
    | 'UP'
    | 'UQ'
    | 'UR'
    | 'US'
    | 'UT'
    | 'UU'
    | 'UV'
    | 'UW'
    | 'UX'
    | 'UY'
    | 'UZ'
    | 'VA'
    | 'VB'
    | 'VC'
    | 'VD'
    | 'VE'
    | 'VF'
    | 'VG'
    | 'VH'
    | 'VI'
    | 'VJ'
    | 'VK'
    | 'VL'
    | 'VM'
    | 'VN'
    | 'VO'
    | 'VP'
    | 'VQ'
    | 'VR'
    | 'VS'
    | 'VT'
    | 'VU'
    | 'VV'
    | 'VW'
    | 'VX'
    | 'VY'
    | 'VZ'
    | 'WA'
    | 'WB'
    | 'WC'
    | 'WD'
    | 'WE'
    | 'WF'
    | 'WG'
    | 'WH'
    | 'WI'
    | 'WJ'
    | 'WK'
    | 'WL'
    | 'WM'
    | 'WN'
    | 'WO'
    | 'WP'
    | 'WQ'
    | 'WR'
    | 'WS'
    | 'WT'
    | 'WU'
    | 'WV'
    | 'WW'
    | 'WX'
    | 'WY'
    | 'WZ'
    | 'XA'
    | 'XB'
    | 'XC'
    | 'XD'
    | 'XE'
    | 'XF'
    | 'XG'
    | 'XH'
    | 'XI'
    | 'XJ'
    | 'XK'
    | 'XL'
    | 'XM'
    | 'XN'
    | 'XO'
    | 'XP'
    | 'XQ'
    | 'XR'
    | 'XS'
    | 'XT'
    | 'XU'
    | 'XV'
    | 'XW'
    | 'XX'
    | 'XY'
    | 'XZ'
    | 'YA'
    | 'YB'
    | 'YC'
    | 'YD'
    | 'YE'
    | 'YF'
    | 'YG'
    | 'YH'
    | 'YI'
    | 'YJ'
    | 'YK'
    | 'YL'
    | 'YM'
    | 'YN'
    | 'YO'
    | 'YP'
    | 'YQ'
    | 'YR'
    | 'YS'
    | 'YT'
    | 'YU'
    | 'YV'
    | 'YW'
    | 'YX'
    | 'YY'
    | 'YZ'
    | 'ZA'
    | 'ZB'
    | 'ZC'
    | 'ZD'
    | 'ZE'
    | 'ZF'
    | 'ZG'
    | 'ZH'
    | 'ZI'
    | 'ZJ'
    | 'ZK'
    | 'ZL'
    | 'ZM'
    | 'ZN'
    | 'ZO'
    | 'ZP'
    | 'ZQ'
    | 'ZR'
    | 'ZS'
    | 'ZT'
    | 'ZU'
    | 'ZV'
    | 'ZW'
    | 'ZX'
    | 'ZY'
    | 'ZZ'

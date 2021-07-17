import EventEmitter from "events";
import Collection from "@discordjs/collection";
import Axios from "axios";
import {
    Node,
    NodeOptions
} from './Node';
import {
    Player,
    PlayerOptions,
    TrackExceptionEvent,
    TrackStartEvent,
    TrackStuckEvent,
    WebSocketClosedEvent
} from "./Player";
import Client from '../Client';
import {
    GuildMember,
    VoiceChannel
} from 'discord.js';
import {
    AnyTrack,
    ResolvedTrack,
    ResolvedTrackData,
    Track
} from "./Track";
//import PlayingMessageManager from "../../MusicStuff/PlayingMessageManager";
import Events from "../Events/Events";
import path from "path";
import { Logger } from "../Utils";

const TEMPLATE = JSON.stringify(["event", "guildId", "op", "sessionId"]);

export interface Manager {
    /**
     * Emitted when a Node is created.
     * @event Manager#nodeCreate
     */
    on(event: "nodeCreate", listener: (node: Node) => void): this;

    /**
     * Emitted when a Node is destroyed.
     * @event Manager#nodeDestroy
     */
    on(event: "nodeDestroy", listener: (node: Node) => void): this;

    /**
     * Emitted when a Node connects.
     * @event Manager#nodeConnect
     */
    on(event: "nodeConnect", listener: (node: Node) => void): this;

    /**
     * Emitted when a Node attempts to reconnect.
     * @event Manager#nodeAttemptReconnect
     */
    on(event: "nodeAttemptReconnect", listener: (node: Node) => void): this;

    /**
     * Emitted when a Node disconnects.
     * @event Manager#nodeDisconnect
     */
    on(event: "nodeDisconnect", listener: (node: Node, reason: { code?: number; reason?: string }) => void): this;

    /**
     * Emitted when a Node has an error.
     * @event Manager#nodeError
     */
    on(event: "nodeError", listener: (node: Node, error: Error) => void): this;

    /**
     * Emitted whenever any data is received from the node via WebSocket.
     * @event Manager#nodeRaw
     */
    on(event: "nodeRaw", listener: (node: Node, payload: any) => void): this;

    /**
     * Emitted when a player is created.
     * @event Manager#playerCreate
     */
    on(event: "playerCreate", listener: (player: Player) => void): this;

    /**
     * Emitted when a player is destroyed.
     * @event Manager#playerDestroy
     */
    on(event: "playerDestroy", listener: (player: Player) => void): this;

    /**
     * Emitted when a player is inactive.
     * @event Manager#playerInactivity
     */
    on(event: "playerInactivity", listener: (player: Player) => void): this;

    /**
     * Emitted when a player voice channel is updated.
     * @event Manager#playerVoiceChannelUpdate
     */
    on(event: "playerVoiceChannelUpdate", listener: (player: Player, oldChannel: VoiceChannel, newChannel: VoiceChannel) => void): this;

    /**
     * Emitted when a player connects to a channel initially.
     * @event Manager#playerConnect
     */
    on(event: "playerConnect", listener: (player: Player, channel: VoiceChannel) => void): this;

    /**
     * Emitted when a player is moved to a new voice channel.
     * @event Manager#playerMove
     */
    on(event: "playerMove", listener: (player: Player, oldChannel: VoiceChannel, newChannel: VoiceChannel) => void): this;

    /**
     * Emitted when a player disconnects from a voice channel.
     * @event Manager#playerDisconnect
     */
    on(event: "playerDisconnect", listener: (player: Player, oldChannel: VoiceChannel) => void): this;

    /**
     * Emitted when a track starts.
     * @event Manager#trackStart
     */
    on(event: "trackStart", listener: (player: Player, track: ResolvedTrack, payload: TrackStartEvent) => void): this;

    /**
     * Emitted when a track ends.
     * @event Manager#trackEnd
     */
    on(event: "trackEnd", listener: (player: Player, track: ResolvedTrack, payload: TrackStartEvent) => void): this;

    /**
     * Emitted when a track gets stuck.
     * @event Manager#trackStuck
     */
    on(event: "trackStuck", listener: (player: Player, track: AnyTrack, payload: TrackStartEvent) => void): this;

    /**
     * Emitted when a track encounters an error.
     * @event Manager#trackError
     */
    on(event: "trackError", listener: (player: Player, track: AnyTrack, payload: TrackStartEvent) => void): this;

    /**
     * Emitted when a the queue ends instead of the Manager#trackEnd event.
     * @event Manager#queueEnd
     */
    on(event: "queueEnd", listener: (player: Player, track: AnyTrack, payload: TrackStartEvent) => void): this;

    /**
     * Emitted when a voice connection is closed.
     * @event Manager#socketClosed
     */
    on(event: "socketClosed", listener: (player: Player, payload: WebSocketClosedEvent) => void): this;

    /**
     * Emitted when a player's errors are ratelimitted.
     * @event Manager#playerCriticalError
     */
    on(event: "criticalError", listener: (player: Player, track: AnyTrack, payload: TrackExceptionEvent | TrackStuckEvent, type: "trackError" | "trackStuck") => void): this;
}

export class Manager extends EventEmitter {
    /** Events */
    public readonly events = new Events(null, this);
    /** The collection of nodes. */
    public readonly nodes = new Collection<string, Node>();
    /** The collection of players. */
    public readonly players = new Collection<string, Player>();
    /** Playing messages */
    //public readonly playingMessages = new PlayingMessageManager();
    /** The options that were set. */
    public readonly options: Required<ManagerOptions>;
    /** The discordjs client */
    public readonly client: Client;
    /** Logger */
    public readonly logger: Logger;

    /** Returns the least used Nodes. */
    public get leastUsedNodes(): Collection<string, Node> {
        return this.nodes
            .filter((node) => node.connected)
            .sort((a, b) => b.calls - a.calls);
    }

    /** Returns the least system load Nodes. */
    public get leastLoadNodes(): Collection<string, Node> {
        return this.nodes
            .filter((node) => node.connected)
            .sort((a, b) => {
                const aload = a.stats.cpu
                    ? (a.stats.cpu.systemLoad / a.stats.cpu.cores) * 100
                    : 0;
                const bload = b.stats.cpu
                    ? (b.stats.cpu.systemLoad / b.stats.cpu.cores) * 100
                    : 0;
                return aload - bload;
            });
    }

    constructor(options: ManagerOptions) {
        super();
        this.options = Object.assign({
            nodes: [
                {
                    identifier: "default",
                    host: "localhost", port: 7001
                }
            ],
            autoplay: true,
            maxErrorsPer10Seconds: 3,
            playerInactivityTimeout: 300000,
            shards: 1
        }, options) as Required<ManagerOptions>;

        this.client = this.options.client;
        this.logger = this.client.logger;
        this.events.load(path.join(__dirname, "../../events/lavalink"));
        //Handle voice state updates on client
        this.client.on('raw', d => this.updateVoiceState(d));
    }

    init() {
        for (const nodeOptions of this.options.nodes) this.createNode(nodeOptions).connect();
    }

    /**
     * Searches the enabled sources based off the URL or the `source` property.
     * @param query
     * @param requester
     * @returns The search result.
     */
    public search(query: string | SearchQuery, requester: GuildMember): Promise<SearchResult> {
        return new Promise(async (resolve, reject) => {
            const node = this.leastUsedNodes.first();
            if (!node) throw new Error("No available nodes.");

            const sources = {
                soundcloud: "sc",
                youtube: "yt",
            };

            const source = sources[(query as SearchQuery).source ?? "youtube"];
            let search = (query as SearchQuery).query ?? (query as string);

            if (!/^https?:\/\//.test(search)) search = `${source}search:${search}`;

            const url = `http${node.options.secure ? "s" : ""}://${node.options.host}:${node.options.port}/loadtracks`;

            const res = await Axios.get<LavalinkResult>(url, {
                headers: { Authorization: node.options.password },
                params: { identifier: search },
                timeout: 10000,
                timeoutErrorMessage: `Node ${node.options.identifier} search timed out.`,
            }).catch((err) => {
                return reject(err);
            });

            node.calls++;

            if (!res || !res.data) return reject(new Error("Query not found."));

            const result: SearchResult = {
                loadType: res.data.loadType,
                exception: res.data.exception ?? null,
                tracks: res.data.tracks.map(track =>
                    new Track(this, track, requester) as ResolvedTrack
                ),
            };

            if (result.loadType === "PLAYLIST_LOADED") {
                result.playlist = {
                    name: res.data.playlistInfo.name,
                    selectedTrack: res.data.playlistInfo.selectedTrack === -1 ? null :
                        new Track(this, res.data.tracks[res.data.playlistInfo.selectedTrack || 0], requester) as ResolvedTrack,
                    duration: result.tracks.reduce((acc, cur) => acc + (cur.duration || 0), 0),
                };
            }

            return resolve(result);
        });
    }

    /**
     * Decodes the base64 encoded tracks and returns a TrackData array.
     * @param tracks
     */
    public decodeTracks(tracks: string[]): Promise<ResolvedTrackData[]> {
        return new Promise(async (resolve, reject) => {
            const node = this.nodes.first();
            if (!node) throw new Error("No available nodes.");
            const url = `http${node.options.secure ? "s" : ""}://${node.options.host
                }:${node.options.port}/decodetracks`;

            const res = await Axios.post<ResolvedTrackData[]>(url, tracks, {
                headers: { Authorization: node.options.password },
            }).catch((err) => {
                return reject(err);
            });

            node.calls++;

            if (!res || !res.data) {
                return reject(new Error("No data returned from query."));
            }

            return resolve(res.data);
        });
    }

    /**
     * Decodes the base64 encoded track and returns a TrackData.
     * @param track
     */
    public decodeTrack(track: string): Promise<ResolvedTrackData> {
        return new Promise(async (resolve, reject) => {
            try {
                const res = await this.decodeTracks([track]);
                return resolve(res[0]);
            } catch (e) {
                return reject(e);
            }
        });
    }

    /**
     * Creates a player or returns one if it already exists.
     * @param options
     */
    public create(options: PlayerOptions): Player {
        if (this.players.has(options.guild.id)) return this.players.get(options.guild.id)!;
        return new Player(this, options);
    }

    /**
     * Returns a player or undefined if it does not exist.
     * @param guildID
     */
    public get(guildID: string): Player | undefined {
        return this.players.get(guildID);
    }

    /**
     * Destroys a player if it exists.
     * @param guildID
     */
    public destroy(guildID: string): void {
        this.players.delete(guildID);
    }

    /**
     * Creates a node or returns one if it already exists.
     * @param options
     */
    public createNode(options: NodeOptions): Node {
        if (this.nodes.has(options.identifier || options.host)) return this.nodes.get(options.identifier || options.host)!;
        return new Node(this, options);
    }

    /**
     * Destroys a node if it exists.
     * @param identifier
     */
    public destroyNode(identifier: string): void {
        const node = this.nodes.get(identifier);
        if (!node) return;
        node.destroy()
        this.nodes.delete(identifier);
    }

    /**
    * Sends voice data to the Lavalink server.
    * @param data
    */
    public updateVoiceState(data: VoicePacket): void {
        if (!data || !["VOICE_SERVER_UPDATE", "VOICE_STATE_UPDATE"].includes(data.t || "")) return;
        const player = this.players.get(data.d.guild_id) as Player;

        if (!player) return;

        const state = player.voiceState;

        if (data.t === "VOICE_SERVER_UPDATE") {
            state.op = "voiceUpdate";
            state.guildId = data.d.guild_id;
            state.event = data.d;
        } else {
            if (data.d.user_id !== this.client.user!.id) return;
            state.sessionId = data.d.session_id;

            if (player.voiceChannel) {
                if (!data.d.channel_id) {
                    this.emit('playerVoiceChannelUpdate', player, player.voiceChannel, null);
                    this.emit('playerDisconnect', player, player.voiceChannel);
                    player.voiceChannel = null;
                }
                else if (player.voiceChannel.id !== data.d.channel_id) {
                    const eventData = [
                        player,
                        player.voiceChannel,
                        player.voiceChannel = this.options.client.channels.resolve(data.d.channel_id as any) as VoiceChannel
                    ]
                    player.setVoiceChannel(player.voiceChannel);
                    this.emit('playerVoiceChannelUpdate', ...eventData);
                    this.emit("playerMove", ...eventData);
                }
            }
            else if (data.d.channel_id) {
                player.voiceChannel = this.client.channels.resolve(data.d.channel_id as any) as VoiceChannel;
                this.emit('playerVoiceChannelUpdate', player, null, player.voiceChannel);
                this.emit('playerConnect', player, player.voiceChannel);
            }
        }

        player.voiceState = state;
        if (JSON.stringify(Object.keys(state).sort()) === TEMPLATE) player.node.send(state).then(() =>
            player.node.send({ op: "pause", guildId: player.guild.id, pause: false })
        );
    }
}

export interface ManagerOptions {
    /** The array of nodes to connect to. */
    nodes?: NodeOptions[];
    /** The client ID to use. */
    client: Client;
    /** Number of shards */
    shards?: number;
    /** The timeout for the player inactivity */
    playerInactivityTimeout?: number;
    /** Maximum errors a player can have on a guild in 10 seconds */
    maxErrorsPer10Seconds?: number;
}

export interface Payload {
    /** The OP code */
    op: number;
    d: {
        guild_id: string;
        channel_id: string | null;
        self_mute: boolean;
        self_deaf: boolean;
    };
}

export interface VoicePacket {
    t?: string;
    d: Partial<{
        guild_id: string;
        user_id: string;
        session_id: string;
        channel_id: string;
    }> &
    VoiceEvent;
}

export interface VoiceEvent {
    token: string;
    guild_id: string;
    endpoint: string;
}

export interface SearchQuery {
    /** The source to search from. */
    source?: "youtube" | "soundcloud";
    /** The query to search for. */
    query: string;
}

export type LoadType =
    | "TRACK_LOADED"
    | "PLAYLIST_LOADED"
    | "SEARCH_RESULT"
    | "LOAD_FAILED"
    | "NO_MATCHES";

export interface PlaylistInfo {
    /** The playlist name. */
    name: string;
    /** The playlist selected track. */
    selectedTrack: ResolvedTrack | null;
    /** The duration of the playlist. */
    duration: number;
}

export interface SearchResult {
    /** The load type of the result. */
    loadType: LoadType;
    /** The array of tracks from the result. */
    tracks: ResolvedTrack[];
    /** The playlist info if the load type is PLAYLIST_LOADED. */
    playlist?: PlaylistInfo;
    /** The exception when searching if one. */
    exception: {
        /** The message for the exception. */
        message: string;
        /** The severity of exception. */
        severity: string;
    } | null;
}

export interface LavalinkResult {
    tracks: ResolvedTrackData[];
    loadType: LoadType;
    exception?: {
        /** The message for the exception. */
        message: string;
        /** The severity of exception. */
        severity: string;
    };
    playlistInfo: {
        name: string;
        selectedTrack?: number;
    };
}

export default Manager;

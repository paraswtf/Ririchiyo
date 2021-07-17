import WebSocket from "ws";
import Manager from './LavalinkClient';
import {
    Player,
    PlayerEvent,
    PlayerEvents,
    TrackEndEvent,
    TrackExceptionEvent,
    TrackStartEvent,
    TrackStuckEvent,
    WebSocketClosedEvent
} from './Player';
import {
    AnyTrack,
    ResolvedTrack
} from './Track';

function processOptions(options: NodeOptions): Required<NodeOptions> {
    const finalOptions = Object.assign({
        port: 2333,
        password: "youshallnotpass",
        secure: false,
        retryAmount: 5,
        retryDelay: 30e3,
    }, options);
    if (!finalOptions.identifier) finalOptions.identifier = finalOptions.host;
    return finalOptions as Required<NodeOptions>;
}

export const defaultNodeStats: NodeStats = {
    players: 0,
    playingPlayers: 0,
    uptime: 0,
    memory: {
        free: 0,
        used: 0,
        allocated: 0,
        reservable: 0,
    },
    cpu: {
        cores: 0,
        systemLoad: 0,
        lavalinkLoad: 0,
    },
    frameStats: {
        sent: 0,
        nulled: 0,
        deficit: 0,
    },
};

export class Node {
    /** The socket for the node. */
    public socket: WebSocket | null = null;
    /** The amount of rest calls the node has made. */
    public calls = 0;
    /** The stats for the node. */
    public stats = defaultNodeStats;
    /** The manager */
    public readonly manager: Manager;
    /** Node options */
    public readonly options: Required<NodeOptions>;

    /** Error handling stuff */
    private reconnectTimeout?: NodeJS.Timeout;
    private reconnectAttempts = 1;
    private errors: Map<string, Map<string, number>> = new Map();

    /** Check if the websocket is connected to the Lavalink Node. */
    public get connected(): boolean {
        return this.socket ? this.socket.readyState === WebSocket.OPEN : false;
    }

    /**
    * Creates an instance of Node.
    * @param options
    */
    constructor(manager: Manager, options: NodeOptions) {
        this.manager = manager;
        this.options = processOptions(options);
        this.manager.nodes.set(this.options.identifier, this);
        this.manager.emit("nodeCreate", this);
    }

    /** Send data to the lavalink node */
    public send(data: unknown): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.connected) return resolve(false);
            if (!data || !JSON.stringify(data).startsWith("{")) return reject(false);
            this.socket!.send(JSON.stringify(data), error => error ? reject(error) : resolve(true));
        });
    }

    /** WS connection handler methods*/
    public connect(): void {
        if (this.connected) return;

        const headers = {
            Authorization: this.options.password,
            "Num-Shards": String(this.manager.options.shards || 1),
            "User-Id": this.manager.client.user!.id,
            "Client-Name": this.manager.client.user!.username
        };

        this.socket = new WebSocket(`ws${this.options.secure ? "s" : ""}://${this.options.host}:${this.options.port}/`, { headers });
        this.socket.on("open", this.open.bind(this));
        this.socket.on("close", this.close.bind(this));
        this.socket.on("message", this.message.bind(this));
        this.socket.on("error", this.error.bind(this));
    }
    public destroy(): void {
        if (!this.connected) return;

        const players = this.manager.players.filter(p => p.node == this);
        if (players.size) players.forEach(p => p.destroy());

        this.socket!.close(1000, "destroy");
        this.socket!.removeAllListeners();
        this.socket = null;

        this.reconnectAttempts = 1;
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

        this.manager.emit("nodeDestroy", this);
        this.manager.destroyNode(this.options.identifier);
    }
    private reconnect(): void {
        this.reconnectTimeout = setTimeout(() => {
            if (this.reconnectAttempts >= this.options.retryAmount) {
                const error = new Error(`Unable to connect after ${this.options.retryAmount} attempts.`)
                this.manager.emit("nodeError", this, error);
                return this.destroy();
            }

            this.socket?.removeAllListeners();
            this.socket = null;
            this.manager.emit("nodeAttemptReconnect", this);
            this.connect();
            this.reconnectAttempts++;
        }, this.options.retryDelay);
    }

    /** WS event handler methods */
    protected open(): void {
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.manager.emit("nodeConnect", this);
    }
    protected close(code: number, reason: string): void {
        this.manager.emit("nodeDisconnect", this, { code, reason });
        if (code !== 1000 || reason !== "destroy") this.reconnect();
    }
    protected error(error: Error): void {
        if (!error) return;
        this.manager.emit("nodeError", this, error);
    }
    protected message(d: Buffer | string): void {
        if (Array.isArray(d)) d = Buffer.concat(d);
        else if (d instanceof ArrayBuffer) d = Buffer.from(d);

        const payload = JSON.parse(d.toString());

        if (!payload.op) return;
        this.manager.emit("nodeRaw", this, payload);

        switch (payload.op) {
            case "stats":
                delete payload.op;
                this.stats = ({ ...payload } as unknown) as NodeStats;
                break;
            case "playerUpdate":
                const player = this.manager.players.get(payload.guildId);
                if (player) player.position = payload.state.position || 0;
                break;
            case "event":
                this.handleEvent(payload);
                break;
            default:
                this.manager.emit("nodeError", this, new Error(`Unexpected op "${payload.op}" with data: ${payload}`));
                break;
        }
    }

    protected handleEvent(payload: PlayerEvent & PlayerEvents): void {
        if (!payload.guildId) return;

        const player = this.manager.players.get(payload.guildId);
        if (!player) return;

        const track = player.current;
        const type = payload.type;
        if (payload.type === "TrackStartEvent") {
            this.trackStart(player, track as ResolvedTrack, payload);
        } else if (payload.type === "TrackEndEvent") {
            this.trackEnd(player, track as ResolvedTrack, payload);
        } else if (payload.type === "TrackStuckEvent") {
            this.trackStuck(player, track as ResolvedTrack, payload);
        } else if (payload.type === "TrackExceptionEvent") {
            this.trackError(player, track as ResolvedTrack, payload);
        } else if (payload.type === "WebSocketClosedEvent") {
            this.socketClosed(player, payload);
        } else {
            const error = new Error(`Node#event unknown event '${type}'.`);
            this.manager.emit("nodeError", this, error);
        }
    }

    protected trackStart(player: Player, track: ResolvedTrack, payload: TrackStartEvent): void {
        player.playing = true;
        player.paused = false;
        this.manager.emit("trackStart", player, track, payload);
    }

    protected trackEnd(player: Player, track: ResolvedTrack, payload: TrackEndEvent): void {
        // If a track had an error while starting
        if (["LOAD_FAILED", "CLEAN_UP"].includes(payload.reason)) {
            this.manager.emit("trackEnd", player, track, payload);
            player.queue.remove(player.queue.currentIndex);

            if (!player.queue.current) {
                if (player.queue.length && player.queueRepeat) player.queue.currentIndex = 0;
                else return this.queueEnd(player, track, payload);
            }

            if (player.autoPlay) player.play();
            return;
        }

        // If a track was forcibly played
        if (payload.reason === "REPLACED") {
            this.manager.emit("trackEnd", player, track, payload);
            return;
        }

        //If the track was stopped by the player (in case of skip)
        if (payload.reason === "STOPPED") {
            this.manager.emit("trackEnd", player, track, payload);
            ++player.queue.currentIndex

            if (!player.queue.current) {
                if (player.queue.length && player.queueRepeat) player.queue.currentIndex = 0;
                else return this.queueEnd(player, track, payload);
            }

            if (player.autoPlay) player.play();
            return;
        }

        //If the track finished playing or other event
        this.manager.emit("trackEnd", player, track, payload);
        if (!player.trackRepeat) ++player.queue.currentIndex;

        if (!player.queue.current) {
            if (player.queue.length && player.queueRepeat) player.queue.currentIndex = 0;
            else return this.queueEnd(player, track, payload);
        }

        if (player.autoPlay) player.play();
    }

    protected queueEnd(player: Player, track: AnyTrack, payload: TrackEndEvent): void {
        player.playing = false;
        player.current = null;
        this.manager.emit("queueEnd", player, track, payload);
    }

    protected trackStuck(player: Player, track: AnyTrack, payload: TrackStuckEvent): void {
        if (this.handleError(player, track, payload, "trackStuck")) player.stop();
        else player.skip();
        this.manager.emit("trackStuck", player, track, payload);
    }

    protected trackError(player: Player, track: AnyTrack, payload: TrackExceptionEvent): void {
        if (this.handleError(player, track, payload, "trackError")) player.stop();
        else player.skip();
        this.manager.emit("trackError", player, track, payload);
    }

    protected socketClosed(player: Player, payload: WebSocketClosedEvent): void {
        this.manager.emit("socketClosed", player, payload);
    }

    protected handleError(player: Player, track: AnyTrack, payload: TrackExceptionEvent | TrackStuckEvent, type: "trackError" | "trackStuck") {
        if (!this.errors.has(type)) this.errors.set(type, new Map())

        const errorsForType = this.errors.get(type)!;

        if (errorsForType.has(player.guild.id)) {
            let numberOfErrors = errorsForType.get(player.guild.id) || 0;

            if (numberOfErrors + 1 >= this.manager.options.maxErrorsPer10Seconds) {
                this.manager.emit("playerCriticalError", player, track, payload, type);
                return true;
            }
            else errorsForType.set(player.guild.id, ++numberOfErrors);
        }
        else {
            errorsForType.set(player.guild.id, 1);
            setTimeout(() => errorsForType.delete(player.guild.id), 10000);
        }
    }
}

export interface NodeOptions {
    /** The host for the node. */
    host: string;
    /** The port for the node. */
    port?: number;
    /** The password for the node. */
    password?: string;
    /** Whether the host uses SSL. */
    secure?: boolean;
    /** The identifier for the node. */
    identifier?: string;
    /** The retryAmount for the node. */
    retryAmount?: number;
    /** The retryDelay for the node. */
    retryDelay?: number;
}

export interface NodeStats {
    /** The amount of players on the node. */
    players: number;
    /** The amount of playing players on the node. */
    playingPlayers: number;
    /** The uptime for the node. */
    uptime: number;
    /** The memory stats for the node. */
    memory: MemoryStats;
    /** The cpu stats for the node. */
    cpu: CPUStats;
    /** The frame stats for the node. */
    frameStats: FrameStats;
}

export interface MemoryStats {
    /** The free memory of the allocated amount. */
    free: number;
    /** The used memory of the allocated amount. */
    used: number;
    /** The total allocated memory. */
    allocated: number;
    /** The reservable memory. */
    reservable: number;
}

export interface CPUStats {
    /** The core amount the host machine has. */
    cores: number;
    /** The system load. */
    systemLoad: number;
    /** The lavalink load. */
    lavalinkLoad: number;
}

export interface FrameStats {
    /** The amount of sent frames. */
    sent?: number;
    /** The amount of nulled frames. */
    nulled?: number;
    /** The amount of deficit frames. */
    deficit?: number;
}

export default Node;

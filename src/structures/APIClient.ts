import { EventEmitter } from "events";
import WebSocket from "ws";
import { CustomError } from "./Utils";

export class BaseWSClient extends EventEmitter {
    readonly host: string;
    readonly options: BaseWSClientOptions;
    private reconnectTimeout?: NodeJS.Timeout;
    private reconnectAttempts = 1;
    readonly stats: APIStats;

    /** The socket for the node. */
    public socket: WebSocket | null = null;

    constructor(host: string, options: BaseWSClientOptions) {
        super();
        this.host = host;
        this.options = options;
        this.stats = {
            totalPlayers: 0
        }
    }

    /** Returns if connected to the Node. */
    public get connected(): boolean {
        if (!this.socket) return false;
        return this.socket.readyState === WebSocket.OPEN;
    }

    /** Connects to the Server. */
    public connect(): void {
        if (this.connected) return;

        const headers = {
            "Authorization": this.options.authorization,
            "ClientID": this.options.clientID,
            "ShardCount": String(this.options.shardCount),
            "ClusterID": String(this.options.clusterID),
        };

        this.socket = new WebSocket(`ws${this.options.secure ? "s" : ""}://${this.options.host}:${this.options.port}/${this.options.path ?? ""}`,
            { headers }
        );
        this.socket.on("open", this.open.bind(this));
        this.socket.on("close", this.close.bind(this));
        this.socket.on("message", this.message.bind(this));
        this.socket.on("error", this.error.bind(this));
    }

    private reconnect(): void {
        this.reconnectTimeout = setTimeout(() => {
            if (this.reconnectAttempts >= (this.options.retryAmount || 5)) {
                const error = new CustomError(`Unable to connect after ${this.options.retryAmount} attempts.`);

                this.emit("connect_error", error);
                return this.destroy();
            }
            this.socket?.removeAllListeners();
            this.socket = null;
            this.emit("reconnect_attempt");
            this.connect();
            this.reconnectAttempts++;
        }, this.options.retryDelay);
    }

    /** Destroys the Node and all players connected with it. */
    public destroy(): void {
        if (!this.connected || !this.socket) return;

        this.socket.close(1000, "destroy");
        this.socket.removeAllListeners();
        this.socket = null;

        this.reconnectAttempts = 1;
        if (typeof this.reconnectTimeout !== "undefined") clearTimeout(this.reconnectTimeout);

        this.emit("disconnect");
    }

    protected open(): void {
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.emit("connect");
    }

    protected close(code: number, reason: string): void {
        this.emit("disconnect", { code, reason });
        if (code !== 1000 || reason !== "destroy") this.reconnect();
    }

    protected error(error: Error): void {
        if (!error) return;
        this.emit("error", error);
    }

    protected message(d: Buffer | string): void {
        if (Array.isArray(d)) d = Buffer.concat(d);
        else if (d instanceof ArrayBuffer) d = Buffer.from(d);

        const payload = JSON.parse(d.toString()) as Payload;

        if (!payload.op) return;
        this.emit("payload", payload);

        switch (payload.op) {
            case "stats":
                Object.assign(this, { stats: { ...payload.data } });
                break;
            case "apiEvent":
                this.handleApiEvent(payload);
                break;
            default:
                this.emit("error", new CustomError(`Unexpected op "${payload.op}" with data: ${payload}`));
                return;
        }
    }

    protected handleApiEvent(payload: APIEventPayload) {
        if (EVENT_HANDLERS[`EVENT_${payload.data.event}`]) EVENT_HANDLERS[`EVENT_${payload.data.event}`](payload);
    }
}

export const EVENT_HANDLERS: EventHandlers = {
    EVENT_TEST: () => {
        return;
    }
}

export type EventHandlers = {
    [key in `EVENT_${APIEventPayload['data']['event']}`]: (d: APIEventPayload) => void;
};

export interface BasePayload {
    op: PayloadOP,
    data: any
}

export type PayloadOP =
    //This is for stats IDK
    | "stats"
    //This is for basically everything
    | "apiEvent"

export interface StatsPayload extends BasePayload {
    op: "stats",
    data: Partial<APIStats>
}

export interface APIEventPayload extends BasePayload {
    op: "apiEvent",
    data: APIEvent
}

export interface UnknownPayload {
    op: "unknown",
    data: any
}

export type Payload =
    | StatsPayload
    | APIEventPayload
    | UnknownPayload

export interface BaseAPIEventData {
    event: string,
    payload: any
}

export interface APIEvent_TEST extends BaseAPIEventData {
    event: "TEST",
    payload: {
        test: "hello world!"
    }
}

export type APIEvent =
    | APIEvent_TEST

export interface APIStats {
    totalPlayers: number,
}

export interface BaseWSClientOptions {
    secure?: boolean,
    host: string,
    port: number,
    path?: string,
    /** The retryAmount for the connection. */
    retryAmount?: number;
    /** The retryDelay for the connection. */
    retryDelay?: number;
    authorization: string,
    clientID: string,
    shardCount: number,
    clusterID: string,
}

export interface BaseWSClient {
    /** Emitted when the ws is connected. */
    on(
        event: "connect",
        listener: () => void
    ): this;
    /** Emitted when the ws is disconnected. */
    on(
        event: "disconnect",
        listener: () => void
    ): this;
    /** Emitted when a connection error occurs. */
    on(
        event: "connect_error",
        listener: (error: CustomError | Error) => void
    ): this;
    /** Emitted when a reconnection is attempted. */
    on(
        event: "reconnect_attempt",
        listener: () => void
    ): this;
    /** Emitted when an error occurs. */
    on(
        event: "error",
        listener: (error: CustomError | Error) => void
    ): this;
    /** Emitted when a valid payload is recieved. */
    on(
        event: "payload",
        listener: (payload: any) => void
    ): this;
}

import { EventEmitter } from "events";
import WebSocket from "ws";
import { CustomError } from "../Utils";
import { APIEvent, APIStats, Payload } from "./API_typings";
import RirichiyoAPI from "./RirichiyoAPI";

export class RirichiyoWSClient extends EventEmitter {
    readonly api: RirichiyoAPI;
    readonly options: RirichiyoWSClientOptions;
    private token?: string;
    private reconnectTimeout?: NodeJS.Timeout;
    private reconnectAttempts = 1;
    readonly stats: APIStats;
    private readonly inactivityHandler: InactivityHandler;

    /** The socket for the node. */
    public socket: WebSocket | null = null;

    constructor(api: RirichiyoAPI, options: RirichiyoWSClientOptions) {
        super();
        this.api = api;
        this.options = Object.assign({
            retryAmount: 5,
            retryDelay: 30e3
        }, options);
        this.stats = {
            totalPlayers: 0
        }
        this.inactivityHandler = new InactivityHandler(this);
    }

    /** Returns if connected to the Node. */
    public get connected(): boolean {
        if (!this.socket) return false;
        return this.socket.readyState === WebSocket.OPEN;
    }

    /** Connects to the Server. */
    public connect(token?: string): void {
        if (this.connected) return;

        if (token) this.token = token;
        if (!this.token) throw new CustomError("No token provided to connect!");

        const auth: Partial<WSConnectionAuth> = {
            appID: this.api.appID,
            token: this.token,
            clientid: this.api.client.user.id,
            clusterid: this.api.client.shard.id,
            shards: this.api.client.shard.shards,
            shardCount: this.api.client.shard.shardCount
        };

        if (Object.values(auth).some(e => typeof e === 'undefined')) throw new CustomError("Invalid API options passed");

        this.socket = new WebSocket(`ws${this.options.secure ? "s" : ""}://${this.api.host}:${typeof this.api.port !== 'undefined' ? `:${this.api.port}` : ''}/${this.options.path ?? ""}`,
            { headers: { authorization: JSON.stringify(auth) } }
        )
        this.socket.on("error", this.error.bind(this));
        this.socket.on("open", this.open.bind(this));
        this.socket.on("close", this.close.bind(this));
        this.socket.on("message", this.message.bind(this));
    }

    private reconnect(): void {
        this.reconnectTimeout = setTimeout(() => {
            if (this.reconnectAttempts >= this.options.retryAmount!) {
                const error = new CustomError(`Unable to connect after ${this.options.retryAmount} attempts.`);

                this.emit("error", error);
                return this.destroy();
            }
            this.socket?.removeAllListeners();
            this.socket = null;
            this.emit("reconnect_attempt");
            this.connect();
            this.reconnectAttempts++;
        }, this.options.retryDelay!);
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

    private open(): void {
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.emit("connect");
        //Start checking the inactivity
        this.inactivityHandler.init();
    }

    private close(code: number, reason: string): void {
        this.inactivityHandler.pause();
        this.emit("disconnect", { code, reason });
        if (code !== 1000 || reason !== "destroy") this.reconnect();
    }

    private error(error: Error): void {
        if (!error) return;
        this.emit("error", error);
    }

    private message(d: Buffer | string): void {
        if (Array.isArray(d)) d = Buffer.concat(d);
        else if (d instanceof ArrayBuffer) d = Buffer.from(d);

        const payload = JSON.parse(d.toString()) as Payload;

        if (!payload.op) return;
        this.api.emit("payload", payload);

        switch (payload.op) {
            case "ping":
                //Play ping pong with api
                this.socket?.send(JSON.stringify({ "op": "pong", "data": "Client response to ping request from server..." }));
                break;
            case "pong": this.inactivityHandler.pong();
                break;
            case "stats":
                Object.assign(this, { stats: { ...payload.data } });
                break;
            case "vote":
                this.api.emit('vote', payload.data);
                break;
            case "apiEvent":
                this.api.emit('apiEvent', payload);
                break;
            default:
                this.emit("error", new CustomError(`Unexpected op "${payload.op}" with data: ${payload}`));
                return;
        }
    }

    async send(data: APIEvent, options: SendOptions): Promise<true> {
        return new Promise((resolve, reject) => {
            this.socket?.send({
                op: 'send',
                data: {
                    options,
                    data
                }
            }, (err) => err ? reject(err) : resolve(true))
        })
    }
}

export class InactivityHandler {
    readonly client: RirichiyoWSClient;
    private receivedPong: boolean;
    initialized: boolean;
    private timeout?: NodeJS.Timeout;
    constructor(client: RirichiyoWSClient) {
        this.client = client;
        this.receivedPong = true;
        this.initialized = false;
    }
    init() {
        this.initialized = true;
        this.run();
        return this;
    }
    pause() {
        this.initialized = false;
        if (this.timeout) clearTimeout(this.timeout);
        return this;
    }
    run() {
        if (this.receivedPong) {
            if (this.client.socket?.readyState === 1) this.client.socket.send(JSON.stringify({ op: "ping", data: "Client requesting ping from server..." }), (err) => err ? console.error(err) : undefined);
            this.receivedPong = false;
            this.timeout = setTimeout(this.run.bind(this), 30e3);
        }
        else this.client.socket?.close();
    }
    pong() {
        this.receivedPong = true;
    }
}

export interface RirichiyoWSClientOptions {
    secure?: boolean,
    path?: string,
    /** The retryAmount for the connection. */
    retryAmount?: number;
    /** The retryDelay for the connection. */
    retryDelay?: number;
}

export interface WSConnectionAuth {
    //The api token  
    token: string;
    //The application ID
    appID: string;
    //The DiscordID of the client
    clientid: string;
    //The ClusterID of the client
    clusterid: number;
    //The shardIDs of the client cluster
    shards: string[];
    //The shardCount of the client
    shardCount: number;
}

export interface SendOptions {
    appIDs: string[],
    clientIDs?: string[]
    //Use one of the below to determine the shard
    guildIDs?: string[];
    //Array of shardIDs for each client
    shardIDs?: bigint[];
    clusterIDs?: number[];
}

export interface RirichiyoWSClient {
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

export default RirichiyoWSClient;

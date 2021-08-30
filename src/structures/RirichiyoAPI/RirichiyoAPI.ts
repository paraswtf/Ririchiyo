import RirichiyoClient from "../RirichiyoClient";
import { RirichiyoWSClient, RirichiyoWSClientOptions } from "./WS";
import Axios, { AxiosInstance } from "axios";
import { EventEmitter } from "events";
import Events from "../Events/Events";
import { join } from "path";

export class RirichiyoAPI extends EventEmitter {
    readonly appID: string;
    readonly host: string;
    readonly port?: number;
    readonly client: RirichiyoClient;
    readonly events: Events<RirichiyoAPI>;
    readonly ws: RirichiyoWSClient;
    readonly request: AxiosInstance;

    constructor(client: RirichiyoClient, options: APIOptions) {
        super();
        this.appID = options.appID;
        this.host = options.host || "ririchiyo-api.herokuapp.com";
        this.port = options.port;
        this.client = client;
        this.events = new Events<RirichiyoAPI>(null, this, this.client.logger).load(join(__dirname, '../../events/ririchiyo-api'));
        this.ws = new RirichiyoWSClient(this, options);
        this.ws.on('error', this.client.logger.error);
        this.ws.on('connect', () => this.client.logger.debug('Ririchiyo API connected!'));
        this.ws.on('reconnect_attempt', () => this.client.logger.debug('Ririchiyo API attempting to reconnect!'));
        this.request = Axios.create({ baseURL: `http${options.secure ? "s" : ""}://${this.host}${typeof this.port !== 'undefined' ? `:${this.port}` : ''}` });
    }

    async connect(token?: string) {
        this.request.defaults.headers = { appid: this.appID, clientid: this.client.user.id };
        this.ws.connect(token);
    }
}

export interface APIOptions extends RirichiyoWSClientOptions {
    readonly appID: string;
    readonly host?: string;
    readonly port?: number;
}

export default RirichiyoAPI;

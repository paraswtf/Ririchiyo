import RirichiyoClient from "../RirichiyoClient";
import { RirichiyoWSClient, RirichiyoWSClientOptions, ConnectOptions } from "./WS";

export class RirichiyoAPI {
    readonly client: RirichiyoClient;
    readonly ws: RirichiyoWSClient;

    constructor(client: RirichiyoClient, options: APIOptions) {
        this.client = client;
        this.ws = new RirichiyoWSClient(options);
        this.ws.on('error', this.client.logger.error);
        this.ws.on('connect', () => this.client.logger.debug('Ririchiyo API connected!'));
        this.ws.on('reconnect_attempt', () => this.client.logger.debug('Ririchiyo API attempting to reconnect!'));
    }

    async connect(options: ConnectOptions) {
        this.ws.connect(options);
    }
}

export interface APIOptions extends RirichiyoWSClientOptions { }

export default RirichiyoAPI;

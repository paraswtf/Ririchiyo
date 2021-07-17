import { join } from "path";
import { Shoukaku as BaseShoukaku, ShoukakuNodeOptions, ShoukakuOptions } from "shoukaku";
import Client from "../Client";
import Events from "../Events/Events";
import { Logger } from "../Utils";

export * from 'shoukaku';

export class Shoukaku extends BaseShoukaku {
    events: Events<this>;
    logger: Logger;

    constructor(client: Client, nodes: ShoukakuNodeOptions[], options: ShoukakuOptions) {
        super(client, nodes, options);
        this.logger = client.logger;
        this.events = new Events(null, this).load(join(__dirname, '../../events/shoukaku'));
    }
}

export default Shoukaku;


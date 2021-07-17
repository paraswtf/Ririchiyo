import BaseEvent from '../../structures/Events/BaseEvent';
import Shoukaku from '../../structures/Shoukaku';

export default class ShoukakuReadyEvent extends BaseEvent<Shoukaku> {
    constructor() {
        super({
            name: "ready",
            category: "shoukakuClient",
        })
    }

    async run(client: Shoukaku) {
        client.logger.info("Shoukaku ready!");
    }
}

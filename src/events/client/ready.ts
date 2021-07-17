import path from 'path';
import BaseEvent from '../../structures/Events/BaseEvent';
import Client from '../../structures/Client';
import Utils from '../../structures/Utils';
import { database } from '../../config'

export default class ReadyEvent extends BaseEvent<Client> {
    constructor() {
        super({
            name: "ready",
            category: "client",
        })
    }

    async run(client: Client) {

        // const presenceUpdater = {
        //     run: async function () {
        //         try {
        //             await client.user?.setActivity({ name: Utils.config.shardingManagerOptions.clientOptions?.presence?.activity?.name, type: Utils.config.shardingManagerOptions.clientOptions?.presence?.activity?.type });
        //         } catch (err) {
        //             client.logger.error(err);
        //         }
        //         setTimeout(() => this.run(), 1800000);
        //     }
        // }
        // presenceUpdater.run();

        //Connect to the database first
        await this.client.db.connect(database.name);
        //Initialize lavalink client
        this.client.lavalink.init();
        //Load all commands
        this.client.commands.load(path.join(__dirname, "../../commands"));

        client.logger.info("Client ready!");
    }
}

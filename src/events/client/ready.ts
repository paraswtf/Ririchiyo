import path from 'path';
import BaseEvent from '../../structures/Events/BaseEvent';
import RirichiyoClient from '../../structures/RirichiyoClient';

export default class ClientReadyEvent extends BaseEvent<RirichiyoClient> {
    constructor() {
        super({
            name: "ready",
            category: "client",
        })
    }

    async run(client: RirichiyoClient) {
        //Connect to the database first
        await this.client.db.connect();

        //Load all commands
        this.client.commands.load(path.join(__dirname, "../../commands"));

        //Run the presence updater
        new PresenceUpdater(this.client, 300).run();

        //Finally log that the cliend ready event has completed
        this.client.logger.info("Client ready!");
    }
}

export class PresenceUpdater {
    private readonly client: RirichiyoClient;
    private readonly timeoutSeconds: number;
    private activityIndex = 0;
    private readonly activityGenerators: ActivityGenerator[];

    constructor(client: RirichiyoClient, timeoutSeconds: number) {
        this.client = client;
        this.timeoutSeconds = timeoutSeconds;
        this.activityGenerators = [
            () => {
                const guildData = this.client.db.getDefaultGuild();
                return { type: 2, name: `${guildData.settings.getSettings().prefix}help` };
            },
            () => ({ type: 2, name: "/help" })
        ]
    }

    run() {
        try {
            if (++this.activityIndex >= this.activityGenerators.length) this.activityIndex = 0;
            this.client.user.setActivity(this.activityGenerators[this.activityIndex]());
            this.client.logger.log("Client presence updated!");
        } catch (err) {
            this.client.logger.error(err);
        }
        setTimeout(() => this.run(), 1000 * this.timeoutSeconds);
    }
}

export type ActivityGenerator = () => { type: number, name: string, url?: string };

import path from 'path';
import { mainBotUserID, topgg } from '../../config';
import BaseEvent from '../../structures/Events/BaseEvent';
import RirichiyoClient from '../../structures/RirichiyoClient';
import Topgg from '../../structures/TopGGAPI';

export default class ClientReadyEvent extends BaseEvent<RirichiyoClient> {
    constructor() {
        super({
            name: "ready",
            category: "client",
        })
    }

    async run(client: RirichiyoClient) {
        //Connect to the database first
        await this.emitter.db.connect();

        //Load all commands
        this.emitter.commands.load(path.join(__dirname, "../../commands"));

        //Run the presence updater
        new StatsUpdater(this.emitter, 1800000).run();

        if (client.shard.id === 0) {
            const existingCommands = await client.application!.commands.fetch();
            // console.log("================================= Existing commands below =================================");
            // console.log(existingCommands.map(c => c.name).join("\n"));
            // console.log("================================= Existing commands above =================================");
            const commands = client.commands.filter(c => !!c.slashCommandData).map(c => c.slashCommandData!);
            for (const command of commands) {
                const existing = existingCommands?.find(c => c.name === command.name);
                if (existing) await client.application!.commands.edit(existing.id, command);
                else await client.application!.commands.create(command);
            }
            // const finalCommands = await client.application!.commands.fetch();
            // console.log("================================= Final commands below =================================");
            // console.log(finalCommands.map(c => c.name).join("\n"));
            // console.log("================================= Final commands above =================================");
        }

        //Finally log that the client ready event has completed
        this.emitter.logger.info("Client ready!");
    }
}

export class StatsUpdater {
    private readonly client: RirichiyoClient;
    private readonly topgg: Topgg;
    private readonly timeoutSeconds: number;
    private activityIndex = 0;
    private readonly activityGenerators: ActivityGenerator[];

    constructor(client: RirichiyoClient, timeoutSeconds: number = 600000) {
        this.client = client;
        this.topgg = new Topgg(this.client, topgg.token);
        this.timeoutSeconds = timeoutSeconds;
        this.activityGenerators = [
            () => ({ type: 2, name: "/help" })
        ]
    }

    async run() {
        try {
            //Loop through the activities and update them
            if (++this.activityIndex >= this.activityGenerators.length) this.activityIndex = 0;
            this.client.user.setActivity(this.activityGenerators[this.activityIndex]());
            //Debug to console
            this.client.logger.debug("Client presence updated!");

            //If this client is the main bot's main shard, post stats everywhere
            if (this.client.user.id === mainBotUserID && this.client.shard.id === 0) {
                const serverCount = await this.client.shard.fetchClientValues('guilds.cache.size').then(res => (res as number[]).reduce((prev, curr) => prev + curr)).catch(this.client.logger.error);
                if (serverCount) {
                    //Try posting stats to top.gg
                    try {
                        await this.topgg.postStats({
                            server_count: serverCount,
                            shard_count: this.client.shard.shardCount
                            //Debug to console
                        }).then((res) => this.client.logger.debug("Client stats posted to top.gg!"), this.client.logger.error);
                    } catch (err) {
                        this.client.logger.error(err);
                    }
                }
            }
        } catch (err) {
            this.client.logger.error(err);
        }
        setTimeout(() => this.run(), this.timeoutSeconds);
    }
}

export type ActivityGenerator = () => { type: number, name: string, url?: string };

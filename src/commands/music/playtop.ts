import { ApplicationCommandData } from 'discord.js';
import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX';

export default class PlayCommand extends BaseCommand<true, false> {
    constructor() {
        super({
            name: "playtop",
            category: "music",
            description: "Add a song to the top of the queue",
            allowGuildCommand: true,
            allowDMCommand: false,
        })
    }

    async run(ctx: GuildCTX<false>) {
        return this.client.commands.get("play")!.run(ctx, true);
    }

    slashCommandData: ApplicationCommandData = {
        name: this.name,
        description: this.description,
        options: [
            {
                name: "query",
                description: "The song link or name to search for",
                type: "STRING",
                required: true
            }
        ]
    }
}

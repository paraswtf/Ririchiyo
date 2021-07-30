import { ApplicationCommandData } from 'discord.js';
import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildCTX } from '../../structures/Commands/CTX';

export default class PlayCommand extends BaseCommand {
    constructor() {
        super({
            name: "playtop",
            aliases: ["pt"],
            category: "music",
            description: "Add a song to the top of the queue",
            allowSlashCommand: true,
            allowMessageCommand: true,
            allowGuildCommand: true,
            allowDMCommand: false,
        })
    }

    async run(ctx: GuildCTX) {
        return this.client.commands.get("play")!.run(ctx, true);
    }

    get slashCommandData(): ApplicationCommandData {
        return {
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
}

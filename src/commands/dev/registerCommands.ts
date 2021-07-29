import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { GuildMessageCTX, DMMessageCTX } from '../../structures/Commands/CTX';
import { owners } from '../../config';
import { Utils, EmbedUtils, ThemeUtils } from '../../structures/Utils';
import { parser as parse } from 'discord-markdown';
import { inspect } from 'util';

export default class EvalCommand extends BaseCommand {
    constructor() {
        super({
            name: "registercommands",
            aliases: ["rcomms"],
            category: "dev",
            description: "Register all slash commands",
            allowSlashCommand: false,
            allowMessageCommand: true,
            allowGuildCommand: true,
            allowDMCommand: true,
            ownerOnly: true,
            hidden: true
        });
    }

    async run(ctx: GuildMessageCTX | DMMessageCTX) {
        //Make absolutely sure that this is not some random user that's typing this command
        if (!owners.find(o => o.id === ctx.author.id)) return await ctx.reply({
            embeds: [EmbedUtils.embedifyString(ctx.guild, "Only the bot owners can use that command!", { isError: true })]
        });

        const existingCommands = await ctx.guild?.commands.fetch();
        const commands = this.client.commands.filter(c => !!c.slashCommandData).map(c => c.slashCommandData!);
        for (const command of commands) {
            const existing = existingCommands?.find(c => c.name === command.name);
            if (existing) await ctx.guild?.commands.edit(existing.id, command);
            else await ctx.guild?.commands.create(command);
        }
    }
}

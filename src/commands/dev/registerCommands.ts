import { owners } from '../../config';
import { EmbedUtils } from '../../structures/Utils';
import { ApplicationCommandData } from 'discord.js';
import BaseCommand from '../../structures/Commands/BaseCommand';
import CTX from '../../structures/Commands/CTX'

export default class RegisterCommandsCommand extends BaseCommand<boolean, false>{
    constructor() {
        super({
            name: "registercommands",
            category: "util",
            description: "Register the slash commands for this server",
            allowGuildCommand: true,
            allowDMCommand: true
        });
    }

    async run(ctx: CTX<true, false>) {
        //Make absolutely sure that this is not some random user that's typing this command
        if (!owners.find(o => o.id === ctx.user.id)) return await ctx.reply({
            embeds: [EmbedUtils.embedifyString(ctx.guild, "Only the bot owners can use that command!", { isError: true })]
        });

        // const existingCommands = await ctx.guild?.commands.fetch();
        // const commands = this.client.commands.filter(c => !!c.slashCommandData).map(c => c.slashCommandData!);
        // for (const command of commands) {
        //     const existing = existingCommands?.find(c => c.name === command.name);
        //     if (existing) await ctx.guild?.commands.edit(existing.id, command);
        //     else await ctx.guild?.commands.create(command);
        // }

        //console.log(await this.client.searchResolver.getRecommendations("Zedd - Clarity ft. Foxes (Official Music Video)"));

        ctx.reply({ content: "TortureNotGud Sed" });
    }

    slashCommandData: ApplicationCommandData = {
        name: this.name,
        description: this.description
    }
}


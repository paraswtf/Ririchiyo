import Utils, {
    CustomEmojiUtils,
    ThemeUtils
} from '../../structures/Utils';
import {
    ApplicationCommandData,
    MessageEmbed,
    Permissions
} from 'discord.js';
import BaseCommand from '../../structures/Commands/BaseCommand';
import CTX from '../../structures/Commands/CTX'
import { inviteGenerateOptions, owners, support_server_url, website_url } from '../../config';

export default class PingCommand extends BaseCommand<boolean, false> {
    constructor() {
        super({
            name: "help",
            category: "util",
            description: "Display all available commands",
            allowGuildCommand: true,
            allowDMCommand: true,
            webhookPermsRequired: new Permissions(["USE_EXTERNAL_EMOJIS"])
        });
    }

    async run(ctx: CTX<boolean, false>) {
        const helpEmbed = new MessageEmbed();

        //Get viewable commands
        const commands = (owners.find(u => u.id === ctx.user.id)
            ? this.client.commands
            : this.client.commands.filter(cmd => !cmd.hidden)).array();

        //Get command categories
        const commandCategories = new Set(commands.map(c => c.category));

        if (!ctx.options.size) {
            helpEmbed.setAuthor(ctx.client.user.username, ctx.client.user.avatarURL() || "https://cdn.discordapp.com/embed/avatars/4.png", website_url)
                .setDescription(`A feature rich and easy to use discord music bot.\n\nMy prefix is \`/\`\n\n**List of all commands-**`)
                .setColor(ThemeUtils.getClientColor(ctx.guild));

            for (const category of commandCategories) {
                helpEmbed.addField(
                    Utils.firstLetterCaps(category),
                    commands.filter(cmd => cmd.category === category)
                        .map(c => `\`/${c.name}\``).join("\n")
                );
            }

            helpEmbed.addField(`\u200B`, `For help about a specific command or category,\nuse \`/${this.name} <category name>\` or \`/${this.name
                } <command name>\`\n\nFeel free to join our **[support server](${support_server_url
                })** for more help.\nAdd me to another server- **[invite](${this.client.generateInvite(inviteGenerateOptions)})**`);
        }
        else {
            const query = (ctx.options.get("query")!.value as string).toLowerCase();

            const command = this.client.commands.get(query);

            //if command is not found, check categories
            const category = command ? null : commandCategories.has(query) ? query : null;

            if (command) {
                helpEmbed
                    .setTitle(`/${command.name}`)
                    .setDescription(`${command.description}\n\n${command.usage ? "**Usage**\n" + command.usage : ''}`)
                    .setColor(ThemeUtils.getClientColor(ctx.guild));
            }
            else if (category) {
                const commandsInCategory = commands.filter(cmd => cmd.category === category);
                helpEmbed
                    .setDescription(`**${Utils.firstLetterCaps(category)} commands**`)
                    .setColor(ThemeUtils.getClientColor(ctx.guild));
                for (const command of commandsInCategory) helpEmbed.addField(`**/${command.name}**`, `${command.description}`, true)
            }
            //if nothing is found
            else helpEmbed
                .setDescription('Could not find the command or category you were looking for.\nPlease check if you have typed it correctly.')
                .setColor(ThemeUtils.colors.get("error").rgbNumber());
        }

        await ctx.reply({ embeds: [helpEmbed] });
    }

    slashCommandData: ApplicationCommandData = {
        name: this.name,
        description: this.description,
        options: [
            {
                name: "query",
                description: "The name of the command or category",
                type: "STRING",
                required: false
            }
        ]
    }
}

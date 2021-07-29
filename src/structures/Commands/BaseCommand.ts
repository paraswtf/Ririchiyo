import RirichiyoClient from '../RirichiyoClient';
import { ApplicationCommandData, Permissions } from 'discord.js';
import {
    InteractionCTX,
    MessageCTX
} from './CTX';

export interface CommandProps {
    /** Name of the command */
    name: string;
    /** Category of the command */
    category: string;
    /** A short description of what the command does to display in the help command */
    description: string;
    /** Aliases that can be used to call the command */
    aliases?: string[];
    /** Cooldown before the command can be used again by the same user */
    cooldown?: number;
    /** If the command is hidden from normal users, it will be visible to owners only in the help command */
    hidden?: boolean;
    /** If the command can be called using discord interactions */
    allowSlashCommand?: boolean;
    /** If the command can be called using discord messages */
    allowMessageCommand?: boolean;
    /** If the command can be called in Guilds */
    allowGuildCommand?: boolean;
    /** If the command can be called in DMs */
    allowDMCommand?: boolean;
    /** Permissions that the bot needs to have in order to run this command */
    botPermsRequired?: Permissions;
    /** If the command is owner only */
    ownerOnly?: boolean;
    /** If the edit event should be passed */
    editable?: boolean;
    /** If the command can be used with a message component interaction */
    allowMessageCommponentInteraction?: boolean
}

export class BaseCommand {
    name: CommandProps['name'];
    category: CommandProps['category'];
    description: CommandProps['description'];
    aliases: CommandProps['aliases'];
    cooldown: number;
    hidden: boolean;
    allowSlashCommand: boolean;
    allowMessageCommand: boolean;
    allowGuildCommand: boolean;
    allowDMCommand: boolean;
    botPermsRequired: CommandProps['botPermsRequired'];
    ownerOnly: boolean;
    editable: boolean;
    allowMessageCommponentInteraction: boolean;
    /** The bot client */
    public readonly client!: RirichiyoClient;
    /** FilePath */
    public readonly filePath!: string;


    constructor(options?: CommandProps) {
        const {
            name,
            aliases,
            category,
            description,
            cooldown,
            hidden,
            allowSlashCommand,
            allowMessageCommand,
            allowGuildCommand,
            allowDMCommand,
            botPermsRequired,
            ownerOnly,
            editable,
            allowMessageCommponentInteraction
        } = check(options);
        this.name = name;
        this.aliases = aliases;
        this.category = category;
        this.description = description;
        this.cooldown = cooldown || 1000;
        this.hidden = hidden || false;
        this.allowSlashCommand = allowSlashCommand ?? true;
        this.allowMessageCommand = allowMessageCommand ?? true;
        this.allowGuildCommand = allowGuildCommand ?? true;
        this.allowDMCommand = allowDMCommand ?? true;
        this.botPermsRequired = botPermsRequired;
        this.ownerOnly = ownerOnly ?? false;
        this.editable = editable ?? false;
        this.allowMessageCommponentInteraction = allowMessageCommponentInteraction ?? false;
    }

    get slashCommandData(): ApplicationCommandData | undefined { return undefined }
    init(client: RirichiyoClient, filePath: string): any { Object.assign(this, { client, filePath }) };
    async run(ctx: InteractionCTX | MessageCTX, opts?: any): Promise<any> { };
    getUsage(guildPrefix: string): string | void { };
    getUsageExamples(guildPrefix: string): string | void { };
}

function check(options?: CommandProps): CommandProps {
    if (!options) throw new TypeError("No options provided for command.");

    if (!options.name) throw new TypeError("No name provided for command.");
    if (typeof options.name !== 'string') throw new TypeError("Command option 'name' must be of type 'string'.");

    if (options.aliases && (Array.isArray(options.aliases) && options.aliases.some((e: any) => typeof e !== 'string'))) throw new TypeError("Aliases of command must be an array of strings.");

    if (!options.category) throw new TypeError("No category provided for command.");
    if (typeof options.category !== 'string') throw new TypeError("Command option 'category' must be of type 'string'.");

    if (!options.description) throw new TypeError("No description provided for command.");
    if (typeof options.description !== 'string') throw new TypeError("Command option 'description' must be of type 'string'.");

    if (typeof options.cooldown !== 'undefined' && typeof options.cooldown !== 'number') throw new TypeError("Command option 'cooldown' must be of type 'number'.");

    if (typeof options.hidden !== 'undefined' && typeof options.hidden !== 'boolean') throw new TypeError("Command option 'hidden' must be of type 'boolean'.");

    if (typeof options.allowSlashCommand !== 'undefined' && typeof options.allowSlashCommand !== 'boolean') throw new TypeError("Command option 'allowSlashCommand' must be of type 'boolean'.");

    if (typeof options.allowMessageCommand !== 'undefined' && typeof options.allowMessageCommand !== 'boolean') throw new TypeError("Command option 'allowMessageCommand' must be of type 'boolean'.");

    if (typeof options.allowGuildCommand !== 'undefined' && typeof options.allowGuildCommand !== 'boolean') throw new TypeError("Command option 'allowGuildCommand' must be of type 'boolean'.");

    if (typeof options.allowDMCommand !== 'undefined' && typeof options.allowDMCommand !== 'boolean') throw new TypeError("Command option 'allowDMCommand' must be of type 'boolean'.");

    if (typeof options.botPermsRequired !== 'undefined' && !(options.botPermsRequired instanceof Permissions)) throw new TypeError("Command option 'botPermsRequired' must be of type 'Discord.Permission'.");

    if (typeof options.ownerOnly !== 'undefined' && typeof options.ownerOnly !== 'boolean') throw new TypeError("Command option 'ownerOnly' must be of type 'boolean'.");

    if (typeof options.editable !== 'undefined' && typeof options.editable !== 'boolean') throw new TypeError("Command option 'editable' must be of type 'boolean'.");

    if (typeof options.allowMessageCommponentInteraction !== 'undefined' && typeof options.allowMessageCommponentInteraction !== 'boolean') throw new TypeError("Command option 'allowMessageCommponentInteraction' must be of type 'boolean'.");

    return options;
}

export default BaseCommand;

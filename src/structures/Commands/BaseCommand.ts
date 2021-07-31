import RirichiyoClient from '../RirichiyoClient';
import { ApplicationCommandData, Permissions } from 'discord.js';
import CTX from './CTX';

export interface CommandProps {
    /** Name of the command */
    name: string;
    /** A short description of what the command does to display in the help command */
    description: string;
    /** Category of the command */
    category: string;
    /** Cooldown before the command can be used again by the same user */
    cooldown?: number;
    /** If the command is hidden from normal users, it will be visible to owners only in the help command */
    hidden?: boolean;
    /** If the command can be called in Guilds */
    allowGuildCommand?: boolean;
    /** If the command can be called in DMs */
    allowDMCommand?: boolean;
    /** Permissions that the bot needs on the server in order to run this command */
    serverPermsRequired?: Permissions;
    /** Permissions that the bot needs in the channel in order to run this command */
    channelPermsRequired?: Permissions;
    /** Permissions that the bot needs to have in order to run this command */
    webhookPermsRequired?: Permissions;
    /** If the command is owner only */
    ownerOnly?: boolean;
    /** If the command can be used with a message component interaction */
    allowMessageCommponentInteraction?: boolean
}

export class BaseCommand<isGuild extends boolean = boolean, allowComponent extends boolean = boolean> {
    name: CommandProps['name'];
    description: CommandProps['description'];
    category: CommandProps['category'];
    cooldown: number;
    hidden: boolean;
    allowGuildCommand: boolean;
    allowDMCommand: boolean;
    serverPermsRequired: CommandProps['serverPermsRequired'];
    channelPermsRequired: CommandProps['channelPermsRequired'];
    webhookPermsRequired: CommandProps['webhookPermsRequired'];
    ownerOnly: boolean;
    allowMessageCommponentInteraction: boolean;
    /** The bot client */
    public readonly client!: RirichiyoClient;
    /** FilePath */
    public readonly filePath!: string;


    constructor(options?: CommandProps) {
        const {
            name,
            category,
            description,
            cooldown,
            hidden,
            allowGuildCommand,
            allowDMCommand,
            serverPermsRequired,
            channelPermsRequired,
            webhookPermsRequired,
            ownerOnly,
            allowMessageCommponentInteraction
        } = check(options);
        this.name = name;
        this.category = category;
        this.description = description;
        this.cooldown = cooldown || 1000;
        this.hidden = hidden || false;
        this.allowGuildCommand = allowGuildCommand ?? true;
        this.allowDMCommand = allowDMCommand ?? true;
        this.serverPermsRequired = serverPermsRequired;
        this.channelPermsRequired = channelPermsRequired;
        this.webhookPermsRequired = webhookPermsRequired;
        this.ownerOnly = ownerOnly ?? false;
        this.allowMessageCommponentInteraction = allowMessageCommponentInteraction ?? false;
    }

    init(client: RirichiyoClient, filePath: string): any { Object.assign(this, { client, filePath }) };
    async run(ctx: CTX<isGuild, allowComponent>, opts?: any): Promise<any> { };

    readonly slashCommandData!: ApplicationCommandData;
    readonly usage?: string;
}

function check(options?: CommandProps): CommandProps {
    if (!options) throw new TypeError("No options provided for command.");

    if (!options.name) throw new TypeError("No name provided for command.");
    if (typeof options.name !== 'string') throw new TypeError("Command option 'name' must be of type 'string'.");

    if (!options.category) throw new TypeError("No category provided for command.");
    if (typeof options.category !== 'string') throw new TypeError("Command option 'category' must be of type 'string'.");

    if (!options.description) throw new TypeError("No description provided for command.");
    if (typeof options.description !== 'string') throw new TypeError("Command option 'description' must be of type 'string'.");

    if (typeof options.cooldown !== 'undefined' && typeof options.cooldown !== 'number') throw new TypeError("Command option 'cooldown' must be of type 'number'.");

    if (typeof options.hidden !== 'undefined' && typeof options.hidden !== 'boolean') throw new TypeError("Command option 'hidden' must be of type 'boolean'.");

    if (typeof options.allowGuildCommand !== 'undefined' && typeof options.allowGuildCommand !== 'boolean') throw new TypeError("Command option 'allowGuildCommand' must be of type 'boolean'.");

    if (typeof options.allowDMCommand !== 'undefined' && typeof options.allowDMCommand !== 'boolean') throw new TypeError("Command option 'allowDMCommand' must be of type 'boolean'.");

    if (typeof options.serverPermsRequired !== 'undefined' && !(options.serverPermsRequired instanceof Permissions)) throw new TypeError("Command option 'botPermsRequired' must be of type 'Discord.Permission'.");

    if (typeof options.channelPermsRequired !== 'undefined' && !(options.channelPermsRequired instanceof Permissions)) throw new TypeError("Command option 'botPermsRequired' must be of type 'Discord.Permission'.");

    if (typeof options.webhookPermsRequired !== 'undefined' && !(options.webhookPermsRequired instanceof Permissions)) throw new TypeError("Command option 'botPermsRequired' must be of type 'Discord.Permission'.");

    if (typeof options.ownerOnly !== 'undefined' && typeof options.ownerOnly !== 'boolean') throw new TypeError("Command option 'ownerOnly' must be of type 'boolean'.");

    if (typeof options.allowMessageCommponentInteraction !== 'undefined' && typeof options.allowMessageCommponentInteraction !== 'boolean') throw new TypeError("Command option 'allowMessageCommponentInteraction' must be of type 'boolean'.");

    return options;
}

export default BaseCommand;

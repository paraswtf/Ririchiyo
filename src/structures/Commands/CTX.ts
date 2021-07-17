import {
    Guild,
    Permissions,
    Message,
    CommandInteraction,
    User,
    TextChannel,
    DMChannel
} from "discord.js";
import Utils from "../Utils";

export class BaseCTX {
    client = Utils.client;
    args: string[] | null;
    guild: Guild | null;
    //guildSettings: GuildSettings | null;
    channel: TextChannel | DMChannel & { guild: undefined };
    botPermissionsForChannel: Readonly<Permissions>;

    constructor(options: InteractionCTXOptions | MessageCTXOptions) {
        this.args = options.args;
        this.guild = options.message.guild;
        //this.guildSettings = options.guildSettings;
        this.channel = options.message.channel as any;
        this.botPermissionsForChannel = options.botPermissionsForChannel;
    }
}

export class InteractionCTX extends BaseCTX {
    readonly isInteraction = true;
    readonly isMessage = false;
    message: CommandInteraction
    author: User;

    constructor(options: InteractionCTXOptions) {
        super(options);
        this.message = options.message;
        this.author = options.message.user;
    }
}

export class MessageCTX extends BaseCTX {
    readonly isInteraction = false;
    readonly isMessage = true;
    message: Message;
    author: User;

    constructor(options: MessageCTXOptions) {
        super(options);
        this.message = options.message;
        this.author = options.message.author;
    }
}


export interface BaseCTXOptions {
    //command: BaseCommand,
    args: string[] | null,
    //guildData: GuildData,
    //guildSettings: GuildSettings | null,
    //userData: UserData,
    botPermissionsForChannel: Readonly<Permissions>
}

export interface InteractionCTXOptions extends BaseCTXOptions {
    message: CommandInteraction,
    isInteraction: true
    isMessage: false
}

export interface MessageCTXOptions extends BaseCTXOptions {
    message: Message,
    isInteraction: false
    isMessage: true
}

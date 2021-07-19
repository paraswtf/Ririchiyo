import {
    Guild,
    Permissions,
    Message,
    CommandInteraction,
    User,
    TextChannel,
    DMChannel,
    GuildMember
} from "discord.js";
import { Guild as GuildData } from "../Data/classes/Guild";
import { GuildSettings } from "../Data/classes/GuildSettings";
import Utils from "../Utils";

export class BaseCTX {
    client = Utils.client;
    args: string[] | null;
    guild: Guild | null;
    guildData: GuildData;
    guildSettings: GuildSettings;
    channel: TextChannel | DMChannel & { guild: undefined };
    botPermissionsForChannel: Readonly<Permissions>;

    constructor(options: InteractionCTXOptions | MessageCTXOptions) {
        this.args = options.args;
        this.guild = options.message.guild;
        this.guildData = options.guildData;
        this.guildSettings = options.guildSettings;
        this.channel = options.message.channel as any;
        this.botPermissionsForChannel = options.botPermissionsForChannel;
    }
}

export class InteractionCTX extends BaseCTX {
    readonly isInteraction = true;
    readonly isMessage = false;
    message: CommandInteraction
    author: User;
    member: GuildMember | null;

    constructor(options: InteractionCTXOptions) {
        super(options);
        this.message = options.message;
        this.author = options.message.user;
        this.member = options.message.member as GuildMember | null;
    }
}

export class MessageCTX extends BaseCTX {
    readonly isInteraction = false;
    readonly isMessage = true;
    message: Message;
    author: User;
    member: GuildMember | null;

    constructor(options: MessageCTXOptions) {
        super(options);
        this.message = options.message;
        this.author = options.message.author;
        this.member = options.message.member;
    }
}


export interface BaseCTXOptions {
    //command: BaseCommand,
    args: string[] | null,
    guildData: GuildData,
    guildSettings: GuildSettings,
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

export type DMMessageCTX = MessageCTX & { guild: null, member: null };
export type DMInteractionCTX = InteractionCTX & { guild: null, member: null };
export type DMCTX = DMMessageCTX | DMInteractionCTX;

export type GuildMessageCTX = MessageCTX & { guild: Guild, member: GuildMember };
export type GuildInteractionCTX = InteractionCTX & { guild: Guild, member: GuildMember };
export type GuildCTX = GuildMessageCTX | GuildInteractionCTX;

import {
    Guild,
    Permissions,
    Message,
    CommandInteraction,
    MessageComponentInteraction,
    User,
    TextChannel,
    DMChannel,
    GuildMember,
    ReplyMessageOptions,
} from "discord.js";
import { message_delete_timeout } from "../../config";
import { Guild as GuildData } from "../Data/classes/Guild";
import { GuildSettings } from "../Data/classes/Guild/settings/GuildSettings";
import Utils from "../Utils";

export class BaseCTX {
    recievedAt: number;
    client = Utils.client;
    args: string[] | null;
    guild: Guild | null;
    guildData: GuildData;
    guildSettings: GuildSettings;
    channel: TextChannel | DMChannel & { guild: undefined };
    botPermissionsForChannel: Readonly<Permissions>;

    constructor(options: InteractionCTXOptions | MessageCTXOptions) {
        this.recievedAt = options.recievedAt;
        this.args = options.args;
        this.guild = options.message.guild;
        this.guildData = options.guildData;
        this.guildSettings = options.guildSettings;
        this.channel = options.message.channel as any;
        this.botPermissionsForChannel = options.botPermissionsForChannel;
    }
}

export class InteractionCTX<ITYPE extends (CommandInteraction | MessageComponentInteraction) = (CommandInteraction | MessageComponentInteraction)> extends BaseCTX {
    readonly isInteraction = true;
    readonly isMessage = false;
    message: ITYPE
    author: User;
    member: GuildMember | null;

    constructor(options: InteractionCTXOptions) {
        super(options);
        this.message = options.message as ITYPE;
        this.author = options.message.user;
        this.member = options.message.member as GuildMember | null;
    }

    async defer(options?: Parameters<this['message']['defer']>[0]) {
        return await this.message.defer(options);
    }

    async reply(options: Parameters<this['message']['reply']>['0'], { ephemeral = false, deleteTimeout = message_delete_timeout, deleteLater = false } = {}) {
        options = Object.assign(options, { ephemeral });
        if (this.message.replied || this.message.deferred) await this.message.followUp(options);
        else await this.message.reply(options);
        if (deleteLater) setTimeout(() => this.message.deleteReply(), deleteTimeout);
        return null;
    }

    async editResponse(options: Parameters<this['message']['editReply']>[0]) {
        return await this.message.editReply(options);
    }
}

export class MessageCTX extends BaseCTX {
    readonly isInteraction = false;
    readonly isMessage = true;
    message: Message;
    author: User;
    member: GuildMember | null;
    isEdit: boolean;
    response: Message | null = null;

    constructor(options: MessageCTXOptions) {
        super(options);
        this.message = options.message;
        this.author = options.message.author;
        this.member = options.message.member;
        this.isEdit = options.isEdit;
    }

    async defer() {
        return;
    }

    async reply(options: Parameters<this['message']['reply']>['0'], { allowEdit = true, ephemeral = false, deleteTimeout = message_delete_timeout, deleteLater = false } = {}) {
        //Handle no read message history permission, append a mention if no read message history permission
        if (!this.botPermissionsForChannel.has("READ_MESSAGE_HISTORY")) {
            if (typeof options === "string") options += this.message.author.toString() + ", ";
            else if ((options as ReplyMessageOptions).content) (options as ReplyMessageOptions).content += this.message.author.toString();
            else Object.assign(options, { content: this.message.author.toString() });
        } else Object.assign(options, { allowedMentions: { repliedUser: false } });

        //If this is an edit then just edit and return
        if (allowEdit &&
            this.isEdit &&
            this.message.previousCommandResponse &&
            this.message.previousCommandResponse.responseMessage &&
            !this.message.previousCommandResponse.responseMessage.deleted)
            return await this.message.previousCommandResponse.responseMessage.edit(options);

        //If there was no editable message/allowEdit was disabled, send a message.
        else if (this.botPermissionsForChannel.has("READ_MESSAGE_HISTORY")) this.response = await this.message.reply(options).then(m => {
            if (ephemeral || deleteLater) setTimeout(async () => m.delete(), deleteTimeout);
            return m;
        });
        else this.response = await this.message.channel.send(options).then(m => {
            if (ephemeral || deleteLater) setTimeout(async () => m.delete(), deleteTimeout);
            return m;
        });;

        //If allowEdit is enabled, set the previousCommandResponse property to the sent message.
        if (allowEdit) {
            if (this.message.previousCommandResponse) {
                Object.assign(this.message.previousCommandResponse, { responseMessage: this.response })
            } else this.message.previousCommandResponse = { responseMessage: this.response! };
        }

        //Finally return the message
        return this.response;
    }

    async editResponse(options: Parameters<Message['edit']>[0]) {
        return await this.response?.edit(options);
    }
}


export interface BaseCTXOptions {
    recievedAt: number,
    //command: BaseCommand,
    args: string[] | null,
    guildData: GuildData,
    guildSettings: GuildSettings,
    //userData: UserData,
    botPermissionsForChannel: Readonly<Permissions>
}

export interface InteractionCTXOptions extends BaseCTXOptions {
    message: CommandInteraction | MessageComponentInteraction,
    isInteraction: true
    isMessage: false
}

export interface MessageCTXOptions extends BaseCTXOptions {
    message: Message,
    isInteraction: false,
    isMessage: true,
    isEdit: boolean
}

export type DMMessageCTX = MessageCTX & { guild: null, member: null };
export type DMInteractionCTX<ITYPE extends (CommandInteraction | MessageComponentInteraction) = (CommandInteraction | MessageComponentInteraction)> = InteractionCTX<ITYPE> & { guild: null, member: null };
export type DMCTX<ITYPE extends (CommandInteraction | MessageComponentInteraction) = (CommandInteraction | MessageComponentInteraction)> = DMMessageCTX | DMInteractionCTX<ITYPE>;

export type GuildMessageCTX = MessageCTX & { guild: Guild, member: GuildMember };
export type GuildInteractionCTX<ITYPE extends (CommandInteraction | MessageComponentInteraction) = (CommandInteraction | MessageComponentInteraction)> = InteractionCTX<ITYPE> & { guild: Guild, member: GuildMember };
export type GuildCTX<ITYPE extends (CommandInteraction | MessageComponentInteraction) = (CommandInteraction | MessageComponentInteraction)> = GuildMessageCTX | GuildInteractionCTX<ITYPE>;

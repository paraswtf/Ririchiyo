import {
    Guild,
    Permissions,
    CommandInteraction,
    GuildMember,
    TextChannel,
    DMChannel,
    ThreadChannel,
    MessageComponentInteraction
} from "discord.js";
import { message_delete_timeout } from "../../config";
import translations, { Language, LanguageName } from "../../config/translations";
import { Guild as GuildData } from "../Data/classes/Guild";
import { GuildSettings } from "../Data/classes/Guild/settings/GuildSettings";
import Utils from "../Utils";
import BaseCommand from "./BaseCommand";

export class CTX<isGuild extends boolean = boolean, allowComponent extends boolean = false> {
    readonly client = Utils.client;
    readonly recievedAt: number;
    readonly interaction: BooleanBasedType<allowComponent, CommandInteraction | MessageComponentInteraction, CommandInteraction>;
    readonly command: BaseCommand<isGuild>;
    readonly options: BooleanBasedType<allowComponent, CommandInteraction['options'] | null, CommandInteraction['options']>;
    readonly guild: BooleanBasedType<isGuild, Guild>;
    readonly guildData: BooleanBasedType<isGuild, GuildData>;
    readonly guildSettings: BooleanBasedType<isGuild, GuildSettings>;
    readonly channel: TextChannel | DMChannel | ThreadChannel;
    readonly botPermissionsForChannel: Readonly<Permissions>;
    readonly user: CommandInteraction['user'];
    readonly member: BooleanBasedType<isGuild, GuildMember>;
    readonly language: Language;

    constructor({
        recievedAt,
        interaction,
        command,
        guildData = null,
        guildSettings = null,
        botPermissionsForChannel,
        language
    }: CTXOptions<isGuild, allowComponent>) {
        this.recievedAt = recievedAt;
        this.interaction = interaction;
        this.command = command;
        this.options = (interaction.isCommand() ? interaction.options : null) as this['options'];
        this.guild = interaction.guild as this['guild'];
        this.guildData = guildData as this['guildData'];
        this.guildSettings = guildSettings as this['guildSettings'];
        this.channel = interaction.channel as this['channel'];
        this.botPermissionsForChannel = botPermissionsForChannel;
        this.user = interaction.user;
        this.member = (interaction.guild ? interaction.guild.members.resolve(this.user) : null) as this['member'];
        this.language = translations.get(language);
    }

    async defer(options?: Parameters<this['interaction']['defer']>[0]) {
        return await this.interaction.defer(options);
    }

    async reply(options: Parameters<this['interaction']['reply']>['0'], { deleteTimeout = message_delete_timeout, deleteLater = false } = {}) {
        if (typeof options === "string") options = { content: options };
        if (this.interaction.replied || this.interaction.deferred) await this.interaction.followUp(options);
        else await this.interaction.reply(options);
        if (deleteLater && !(options as any).ephemeral) setTimeout(() => this.interaction.deleteReply(), deleteTimeout);
        return null;
    }
}

export interface CTXOptions<isGuild extends boolean = boolean, allowComponent extends boolean = false> {
    readonly recievedAt: number,
    readonly interaction: BooleanBasedType<allowComponent, CommandInteraction | MessageComponentInteraction, CommandInteraction>,
    readonly command: BaseCommand<isGuild>,
    readonly guildData: BooleanBasedType<isGuild, GuildData, null | undefined>,
    readonly guildSettings: BooleanBasedType<isGuild, GuildSettings, null | undefined>,
    //userData: UserData,
    readonly botPermissionsForChannel: Readonly<Permissions>,
    readonly language: LanguageName
}

export type GuildCTX<allowComponent extends boolean = false> = CTX<true, allowComponent>;
export type DMCTX<allowComponent extends boolean = false> = CTX<false, allowComponent>;
export type AllCTX<allowComponent extends boolean = false> = GuildCTX<allowComponent> | DMCTX<allowComponent>;

export type BooleanBasedType<isTrue, T, TNot = null> = isTrue extends true ? T : TNot;

export default CTX;

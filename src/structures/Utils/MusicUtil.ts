import Utils from "./";
import {
    Guild,
    GuildMember,
    StageChannel,
    VoiceChannel
} from "discord.js";
import CTX from "../Commands/CTX";
import EmbedUtils from "./EmbedUtils";
import {
    InternalPermissionResolvable,
    InternalPermissions
} from "./InternalPermissions";
import Dispatcher from "../Shoukaku/Dispatcher";


export class MusicUtil {
    private static async sendError(error: string, ctx: CTX<true, boolean>, ephemeral: boolean) {
        return await ctx.reply({ embeds: [EmbedUtils.embedifyString(ctx.guild, error, { isError: true })], ephemeral });
    }

    public static canPerformAction(options: CanPerformActionrOptions): Success | Error {
        const {
            guild,
            member,
            ctx,
            memberPermissions,
            requiredPermissions,
            vcMemberAmtForAllPerms,
            noDispatcherRequired,
            isSpawnAttempt,
            allowViewOnly
        } = Object.assign({
            vcMemberAmtForAllPerms: 3,
            noDispatcherRequired: false,
            isSpawnAttempt: false,
            sendError: true,
            allowViewOnly: false
        }, options);

        const dispatcher = Utils.client.dispatchers.get(guild.id);
        const { channel: botVc } = guild.me?.voice || {};
        const { channel: memberVc } = member.voice;

        if (!noDispatcherRequired && !dispatcher) {
            if (ctx) this.sendError(ctx.language.NOTHING_PLAYING, ctx, true);
            return new Error(FLAG.NO_DISPATCHER, memberPermissions);
        }

        if (dispatcher && botVc) {
            if (!memberVc) {
                if (isSpawnAttempt) {
                    if (ctx) this.sendError(ctx.language.ALREADY_PLAYING_DIFFERENT_VC, ctx, true);
                    return new Error(FLAG.DISPATCHER_ALREADY_EXISTS, memberPermissions);
                }
                if (ctx) this.sendError(ctx.language.NEED_TO_BE_IN_SAME_VC, ctx, true);
                return new Error(FLAG.NO_AUTHOR_CHANNEL_AND_DISPATCHER_EXISTS, memberPermissions);
            }
            else {
                if (memberVc.id !== botVc.id) {
                    if (isSpawnAttempt) {
                        if (ctx) this.sendError(ctx.language.ALREADY_PLAYING_DIFFERENT_VC, ctx, true);
                        return new Error(FLAG.DISPATCHER_ALREADY_EXISTS, memberPermissions);
                    }
                    if (ctx) this.sendError(ctx.language.NEED_TO_BE_IN_SAME_VC, ctx, true);
                    return new Error(FLAG.DISPATCHER_IN_DIFFERENT_CHANNEL, memberPermissions);
                }
                else {
                    if (isSpawnAttempt) {
                        if (ctx) this.sendError(ctx.language.ALREADY_PLAYING_YOUR_VC, ctx, true);
                        return new Error(FLAG.DISPATCHER_ALREADY_EXISTS_SAME_CHANNEL, memberPermissions);
                    }
                    const vcMemberCount = memberVc.members.filter(m => !m.user.bot).size;
                    const missingPerms = memberPermissions.missing(requiredPermissions);
                    const hasPerms = !missingPerms || missingPerms.length === 0;
                    if (hasPerms) return new Success(FLAG.HAS_PERMS, memberPermissions, memberVc, dispatcher);
                    else {
                        if (vcMemberCount > vcMemberAmtForAllPerms) {
                            if (ctx) this.sendError(Utils.formatString(
                                ctx.language.MISSING_PLAYER_PERMISSIONS_MESSAGE,
                                `•\`${missingPerms.join("`\n•`")}\`\n`
                            ), ctx, true);
                            return new Error(FLAG.NO_PERMS_AND_NOT_ALONE, memberPermissions);
                        }
                        return new Success(FLAG.NO_PERMS_BUT_ALONE, memberPermissions, memberVc, dispatcher);
                    }
                }
            }
        }
        else {
            const missingPerms = memberPermissions.missing(requiredPermissions);
            const hasPerms = !missingPerms || missingPerms.length === 0;
            if (hasPerms) {
                if (isSpawnAttempt && !memberVc) {
                    if (ctx) this.sendError(ctx.language.NEED_TO_BE_IN_VC, ctx, true);
                    return new Error(FLAG.NO_VOICE_CHANNEL, memberPermissions);
                }
                if (isSpawnAttempt) return new Success(FLAG.HAS_PERMS_TO_SPAWN_DISPATCHER, memberPermissions, memberVc!);
                return new Success(FLAG.HAS_PERMS_AND_NO_DISPATCHER, memberPermissions);
            }
            else {
                if (isSpawnAttempt) {
                    if (!memberVc) {
                        if (ctx) this.sendError(ctx.language.NEED_TO_BE_IN_VC, ctx, true);
                        return new Error(FLAG.NO_VOICE_CHANNEL, memberPermissions);
                    }
                    else {
                        const vcMemberCount = memberVc.members.filter(m => !m.user.bot).size;
                        if (vcMemberCount > vcMemberAmtForAllPerms) {
                            if (ctx) this.sendError(Utils.formatString(
                                ctx.language.MISSING_PLAYER_PERMISSIONS_MESSAGE,
                                `•\`${missingPerms.join("`\n•`")}\`\n`
                            ), ctx, true);
                            return new Error(FLAG.NO_PERMS_TO_SPAWN_DISPATCHER, memberPermissions);
                        }
                        return new Success(FLAG.NO_PERMS_BUT_ALONE, memberPermissions, memberVc);
                    }
                }
                else {
                    if (allowViewOnly) return new Success(FLAG.VIEW_ONLY, memberPermissions);
                    else {
                        if (ctx) this.sendError(ctx.language.NOTHING_PLAYING, ctx, true);
                        return new Error(FLAG.NO_PERMS_AND_NO_DISPATCHER, memberPermissions);
                    }
                }
            }
        }
    }
}

export interface CanPerformActionrOptions {
    guild: Guild,
    member: GuildMember,
    ctx?: CTX<true, boolean>,
    memberPermissions: InternalPermissions,
    requiredPermissions: InternalPermissionResolvable,
    vcMemberAmtForAllPerms?: number,
    noDispatcherRequired?: boolean,
    isSpawnAttempt?: boolean,
    allowViewOnly?: boolean
}

export enum FLAG {
    NULL = 1 << 0,
    NO_DISPATCHER = 1 << 1,
    DISPATCHER_ALREADY_EXISTS = 1 << 2,
    NO_AUTHOR_CHANNEL_AND_DISPATCHER_EXISTS = 1 << 3,
    DISPATCHER_IN_DIFFERENT_CHANNEL = 1 << 4,
    DISPATCHER_ALREADY_EXISTS_SAME_CHANNEL = 1 << 5,
    NO_PERMS_AND_NOT_ALONE = 1 << 6,
    NO_VOICE_CHANNEL = 1 << 7,
    NO_PERMS_TO_SPAWN_DISPATCHER = 1 << 8,
    NO_PERMS_AND_NO_DISPATCHER = 1 << 9,
    HAS_PERMS = 1 << 10,
    NO_PERMS_BUT_ALONE = 1 << 11,
    HAS_PERMS_TO_SPAWN_DISPATCHER = 1 << 12,
    HAS_PERMS_AND_NO_DISPATCHER = 1 << 13,
    VIEW_ONLY = 1 << 14,
    NO_EMBED_PERMISSION = 1 << 15,
    RESPAWNED = 1 << 16,
    NO_BOT_PERMS_VIEW_CHANNEL = 1 << 17,
    NO_BOT_PERMS_CONNECT = 1 << 18,
    NO_BOT_PERMS_SPEAK = 1 << 19,
}

export class Error {
    // Class props //
    flag: FLAG;
    memberPerms: InternalPermissions;
    missingPerms?: string[]
    isPermsError = false;
    readonly isSuccess = false;
    readonly isError = true;
    // Class props //

    constructor(flag: FLAG, memberPerms?: InternalPermissions, missingPerms?: string[]) {
        this.flag = flag;
        this.memberPerms = memberPerms || new InternalPermissions(0);
        if (missingPerms && missingPerms.length > 0) {
            this.isPermsError = true;
            this.missingPerms = missingPerms;
        }
    }
}

export class Success {
    // Class props //
    flag: FLAG;
    memberPerms: InternalPermissions;
    authorVoiceChannel?: VoiceChannel | StageChannel;
    dispatcher?: Dispatcher;
    readonly isSuccess = true;
    readonly isError = false;
    // Class props //
    constructor(flag: FLAG, memberPerms?: InternalPermissions, authorVoiceChannel?: VoiceChannel | StageChannel, dispatcher?: Dispatcher) {
        this.flag = flag;
        this.memberPerms = memberPerms || new InternalPermissions(0);
        this.authorVoiceChannel = authorVoiceChannel;
        this.dispatcher = dispatcher;
    }
}

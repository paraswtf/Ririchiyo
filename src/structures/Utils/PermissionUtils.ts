import {
    Utils
} from '.';
import {
    Guild,
    Channel,
    TextChannel,
    GuildChannel,
    UserResolvable,
    Permissions,
    PermissionResolvable,
    PermissionString,
    MessageEmbed
} from 'discord.js';
import { DirectMessageUtils, EmbedUtils } from '.';
import CTX from '../Commands/CTX';
const dmPerms = new Permissions([
    'ADD_REACTIONS',
    'ATTACH_FILES',
    'EMBED_LINKS',
    'MENTION_EVERYONE',
    'READ_MESSAGE_HISTORY',
    'SEND_MESSAGES',
    'SPEAK',
    'USE_EXTERNAL_EMOJIS',
    'VIEW_CHANNEL'
]);


export class PermissionUtils {
    public static getPermissionsForChannel(channel: GuildChannel | Channel & { guild: undefined }) {
        if (channel?.type && ['DM', 'GROUP_DM'].includes(channel.type)) return new Permissions(dmPerms);
        else return (channel as GuildChannel).permissionsFor(Utils.client.user) ?? new Permissions();
    }

    public static async handlePermissionsForChannel(channel: GuildChannel | Channel & { guild: undefined }, {
        ctx,
        userToDM,
        channelToSendMessage,
        guild = null,
        guildPermissions = undefined,
        channelPermissions = undefined,
        webhookPermissions = undefined,
        guildPermsRequired,
        channelPermsRequired,
        webhookPermsRequired,
        checkAdmin = true,
        dmGuildOwnerAsAlt = true
    }: GetPermissionsOptions = {}) {
        //The guild if ctx was passed
        if (!guild) guild = ctx?.guild ?? null;
        //Can provide previously fetched permissions for channel to save resources
        if (!guildPermissions) guildPermissions = guild?.me?.permissions ?? new Permissions();
        if (!channelPermissions) channelPermissions = this.getPermissionsForChannel(channel);
        if (!webhookPermissions) webhookPermissions = guild ? (channel as GuildChannel).permissionsFor(guild.roles.everyone) : new Permissions(["SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]);

        //If channel is text channel, add default required permission
        if (channel.isText() && channel.guild) channelPermsRequired = new Permissions(channelPermsRequired).add(['SEND_MESSAGES', 'EMBED_LINKS']);

        //Check if has all permissions
        let returnValue: GetPermissionsResult = {
            guildPermissions,
            channelPermissions,
            webhookPermissions,
            hasAll: true,
            missingGuildPermissions: null,
            missingChannelPermissions: null,
            missingWebhookPermissions: null
        }

        if (guildPermsRequired) {
            returnValue.missingGuildPermissions = guildPermissions?.missing(guildPermsRequired, checkAdmin) ?? null;
            if (!returnValue.missingGuildPermissions?.length) returnValue.missingGuildPermissions = null;
        }
        if (channelPermsRequired) {
            returnValue.missingChannelPermissions = channelPermissions?.missing(channelPermsRequired, checkAdmin) ?? null;
            if (!returnValue.missingChannelPermissions?.length) returnValue.missingChannelPermissions = null;
        }
        if (webhookPermsRequired) {
            returnValue.missingWebhookPermissions = webhookPermissions?.missing(webhookPermsRequired, checkAdmin) ?? null;
            if (!returnValue.missingWebhookPermissions?.length) returnValue.missingWebhookPermissions = null;
        }
        if (
            returnValue.missingGuildPermissions ||
            returnValue.missingChannelPermissions ||
            returnValue.missingWebhookPermissions
        ) returnValue.hasAll = false;

        //If bot does not have all permissions and there are missing perms
        if (!returnValue.hasAll &&
            //And if there is somewhere to send a error message
            (ctx || channelToSendMessage || userToDM || (guild && dmGuildOwnerAsAlt))
        ) {
            //In case of interaction ctx
            if (ctx) {
                await ctx.reply({
                    embeds: [
                        EmbedUtils.embedifyString(guild, this.getErrorString(returnValue, channel.id, ctx.channel.id), { isError: true })
                    ]
                });
            }
            //In case of given channel
            else if (channelToSendMessage && channelToSendMessage.permissionsFor(Utils.client.user!)?.has('SEND_MESSAGES', checkAdmin)) {
                const permissions = this.getPermissionsForChannel(channelToSendMessage);
                let noPermsMessage: { content: string } | { embeds: MessageEmbed[] } = {
                    content: this.getErrorString(returnValue, channel.id, channelToSendMessage.id)
                };
                if (permissions?.has('EMBED_LINKS', checkAdmin)) noPermsMessage = {
                    embeds: [EmbedUtils.embedifyString(guild, noPermsMessage.content!, { isError: true })]
                };
                await channelToSendMessage.send(noPermsMessage);
            }
            //In case of no given channel perms or no given channel
            else if (userToDM || (guild && dmGuildOwnerAsAlt)) {
                await DirectMessageUtils.send({
                    embeds: [EmbedUtils.embedifyString(null, this.getErrorString(returnValue, channel.id, "0"))]
                },
                    userToDM || guild?.ownerId!, userToDM ?
                    (dmGuildOwnerAsAlt ? channel.guild?.ownerId : undefined)
                    : undefined
                );
            }
        }

        return returnValue;
    }

    /**
     * Generate the no permissions message string
     * @param {PermissionString[]} missing Missing permissions string array
     * @param {Channel} channel The discord channel
     */
    public static generateNoPermsMessage(missing: PermissionString[], { type, channelID }: GenerateNoPermsMessageOptions): string {
        switch (type) {
            default:
            case "CHANNEL":
                return `I don't have the following permissions in ${channelID ? `<#${channelID}>` : 'this channel'} for the command to work properly.\n\n•\`${missing.join("`\n•`")}\``;
            case "GUILD":
                return `I don't have the following permissions in this guild for the command to work properly.\n\n•\`${missing.join("`\n•`")}\``;
            case "WEBHOOK":
                return `The everyone role needs to have these permissions in ${channelID ? `<#${channelID}>` : 'this channel'} for this command to work properly.\n\n•\`${missing.join("`\n•`")}\``;
        }
    }

    public static getErrorString(returnValue: GetPermissionsResult, checkingChannelID: string, sentChannelID: string) {
        const errors = [];
        if (returnValue.missingChannelPermissions) errors.push(this.generateNoPermsMessage(returnValue.missingChannelPermissions, {
            channelID: sentChannelID === checkingChannelID ? undefined : checkingChannelID, type: "CHANNEL"
        }));
        if (returnValue.missingGuildPermissions) errors.push(this.generateNoPermsMessage(returnValue.missingGuildPermissions, { type: "GUILD" }));
        if (returnValue.missingWebhookPermissions) errors.push(this.generateNoPermsMessage(returnValue.missingWebhookPermissions, { type: "WEBHOOK" }));
        return errors.join("\n\n");
    }
}

export interface GenerateNoPermsMessageOptions {
    channelID?: string,
    type: "GUILD" | "CHANNEL" | "WEBHOOK"
}

export interface GetPermissionsOptions {
    guildPermsRequired?: PermissionResolvable,
    channelPermsRequired?: PermissionResolvable,
    webhookPermsRequired?: PermissionResolvable,
    checkAdmin?: boolean,
    userToDM?: UserResolvable,
    channelToSendMessage?: TextChannel & GuildChannel,
    ctx?: CTX<boolean, boolean>,
    guild?: Guild | null,
    guildPermissions?: Permissions | null,
    channelPermissions?: Permissions | null,
    webhookPermissions?: Permissions | null,
    dmGuildOwnerAsAlt?: boolean
}

export interface GetPermissionsResult {
    hasAll: boolean,
    missingWebhookPermissions: PermissionString[] | null,
    missingChannelPermissions: PermissionString[] | null,
    missingGuildPermissions: PermissionString[] | null,
    guildPermissions: Permissions | null,
    channelPermissions: Permissions,
    webhookPermissions: Permissions | null,
}

export default PermissionUtils;

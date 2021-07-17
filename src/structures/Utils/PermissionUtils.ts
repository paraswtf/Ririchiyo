import Utils from '.';
import {
    Channel,
    TextChannel,
    GuildChannel,
    UserResolvable,
    Permissions,
    PermissionResolvable,
    PermissionString,
    MessageEmbed,
    Message,
    CommandInteraction
} from 'discord.js';
import { DirectMessageUtils, EmbedUtils } from '.';
import { InteractionCTX, MessageCTX } from '../Commands/CTX';
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
        if (!channel.guild) return new Permissions(dmPerms);
        else return channel.permissionsFor(Utils.client.user!) ?? new Permissions();
    }

    public static async handlePermissionsForChannel(channel: GuildChannel | Channel & { guild: undefined }, options: GetPermissionsOptions = {}) {
        options = Object.assign({ dmGuildOwnerAsAlt: true }, options);

        if (!options.permissions) options.permissions = this.getPermissionsForChannel(channel);

        if (channel.isText() && channel.guild) options.requiredPermissions = new Permissions(options.requiredPermissions).add(['SEND_MESSAGES', 'EMBED_LINKS']);

        let returnValue: GetPermissionsResult = {
            hasAll: options.requiredPermissions ? options.permissions.has(options.requiredPermissions, options.checkAdmin) : true,
            missing: options.requiredPermissions ? options.permissions.missing(options.requiredPermissions, options.checkAdmin) : null,
            permissions: options.permissions
        }

        //If bot does not have all permissions and there are missing perms
        if (!returnValue.hasAll && returnValue.missing &&
            //And if there is somewhere to send a error message
            (options.ctx || options.channelToSendMessage || options.userToDM)
        ) {
            if (options.ctx
                && (options.ctx.channel.guild
                    ? options.ctx.channel.permissionsFor(Utils.client.user!)?.has('SEND_MESSAGES')
                    : true
                )
            ) {
                const permissions = this.getPermissionsForChannel(options.ctx.channel);

                let noPermsMessage: NoPermsMessage = {
                    content: this.generateNoPermsMessage(returnValue.missing, options.ctx.channel.id === channel.id ? undefined : channel.id)
                };

                if (permissions?.has('EMBED_LINKS')) noPermsMessage = {
                    embeds: [EmbedUtils.embedifyString(options.ctx.guild, noPermsMessage.content!, { isError: true })]
                };

                options.ctx.message.reply(noPermsMessage);
            }
            else if (
                options.channelToSendMessage
                && options.channelToSendMessage.permissionsFor(Utils.client.user!)?.has('SEND_MESSAGES')
            ) {
                const permissions = this.getPermissionsForChannel(options.channelToSendMessage);
                let noPermsMessage: NoPermsMessage = {
                    content: this.generateNoPermsMessage(returnValue.missing, options.channelToSendMessage.id === channel.id ? undefined : channel.id)
                };
                if (permissions?.has('EMBED_LINKS')) noPermsMessage = {
                    embeds: [EmbedUtils.embedifyString(options.channelToSendMessage.guild, noPermsMessage.content!, { isError: true })]
                };

                options.channelToSendMessage.send(noPermsMessage);
            }
            else if (
                options.message?.channel
                && this.getPermissionsForChannel(options.message.channel as TextChannel).has('SEND_MESSAGES')
            ) {
                const permissions = this.getPermissionsForChannel(options.message.channel as TextChannel);

                let noPermsMessage: NoPermsMessage = {
                    content: this.generateNoPermsMessage(returnValue.missing, options.message.channel.id === channel.id ? undefined : channel.id)
                };

                if (permissions?.has('EMBED_LINKS')) noPermsMessage = {
                    embeds: [EmbedUtils.embedifyString(options.message.guild, noPermsMessage.content!, { isError: true })]
                };

                options.message.reply(noPermsMessage);
            }
            else if (options.userToDM) {
                await DirectMessageUtils.send(
                    {
                        embeds: [EmbedUtils.embedifyString(null, this.generateNoPermsMessage(returnValue.missing, channel.id))]
                    }, options.userToDM, options.dmGuildOwnerAsAlt ? channel.guild?.ownerId : undefined
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
    public static generateNoPermsMessage(missing: PermissionString[], channelID?: string): string {
        return `I don't have the following permissions in ${channelID ? `<#${channelID}>` : 'this channel'} for the command to work properly.\n\n•\`${missing.join("`\n•`")}\``;
    }
}

export interface GetPermissionsOptions {
    requiredPermissions?: PermissionResolvable,
    checkAdmin?: boolean,
    userToDM?: UserResolvable,
    channelToSendMessage?: TextChannel & GuildChannel,
    ctx?: MessageCTX | InteractionCTX,
    message?: Message | CommandInteraction,
    permissions?: Permissions,
    dmGuildOwnerAsAlt?: boolean
}

export interface GetPermissionsResult {
    hasAll: boolean,
    missing: PermissionString[] | null,
    permissions: Permissions
}

export type NoPermsMessage = { content: string } | { embeds: MessageEmbed[] };

export default PermissionUtils;

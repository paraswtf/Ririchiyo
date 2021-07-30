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
    CommandInteraction,
    Interaction
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
    public static getPermissionsForChannel(channel: GuildChannel | Channel & { guild: undefined }, isWebhook = false) {
        if (channel?.type && ['DM', 'GROUP_DM', 'UNKNOWN'].includes(channel.type)) return new Permissions(dmPerms);
        else if (isWebhook) return (channel as GuildChannel).guild.roles.everyone.permissions
        else return (channel as GuildChannel).permissionsFor(Utils.client.user) ?? new Permissions();
    }

    public static async handlePermissionsForChannel(channel: GuildChannel | Channel & { guild: undefined }, options: GetPermissionsOptions = {}) {
        options = Object.assign({ dmGuildOwnerAsAlt: true }, options);

        //Can provide previously fetched permissions for channel to save resources
        if (!options.permissions) options.permissions = this.getPermissionsForChannel(channel, options.isWebhook);

        //If channel is text channel, add default required permission
        if (channel.isText() && channel.guild) options.requiredPermissions = new Permissions(options.requiredPermissions).add(['SEND_MESSAGES', 'EMBED_LINKS']);

        //Check if has all permissions
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
            //In case of interaction ctx
            if (options.ctx) {
                await options.ctx.reply({
                    embeds: [
                        EmbedUtils.embedifyString(
                            options.ctx.guild,
                            this.generateNoPermsMessage(returnValue.missing, options.ctx.channel.id === channel.id ? undefined : channel.id),
                            { isError: true }
                        )
                    ]
                });
            }
            //In case of given channel
            else if (options.channelToSendMessage && options.channelToSendMessage.permissionsFor(Utils.client.user!)?.has('SEND_MESSAGES')) {
                const permissions = this.getPermissionsForChannel(options.channelToSendMessage);
                let noPermsMessage: { content: string } | { embeds: MessageEmbed[] } = {
                    content: this.generateNoPermsMessage(returnValue.missing, options.channelToSendMessage.id === channel.id ? undefined : channel.id)
                };
                if (permissions?.has('EMBED_LINKS')) noPermsMessage = {
                    embeds: [EmbedUtils.embedifyString(options.channelToSendMessage.guild, noPermsMessage.content!, { isError: true })]
                };

                await options.channelToSendMessage.send(noPermsMessage);
            }
            //In case of no given channel perms or no given channel
            else if (options.userToDM) {
                await DirectMessageUtils.send({
                    embeds: [EmbedUtils.embedifyString(null, this.generateNoPermsMessage(returnValue.missing, channel.id))]
                }, options.userToDM, options.dmGuildOwnerAsAlt ? channel.guild?.ownerId : undefined);
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
    ctx?: CTX<boolean, boolean>,
    permissions?: Permissions,
    dmGuildOwnerAsAlt?: boolean
    isWebhook?: boolean
}

export interface GetPermissionsResult {
    hasAll: boolean,
    missing: PermissionString[] | null,
    permissions: Permissions
}

export default PermissionUtils;

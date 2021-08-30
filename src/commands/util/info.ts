import {
    inviteGenerateOptions,
    OwnerObject,
    owners
} from '../../config';
import {
    CustomEmojiUtils,
    ThemeUtils
} from '../../structures/Utils';
import {
    ApplicationCommandData,
    MessageEmbed,
    Permissions,
    User
} from 'discord.js';
import BaseCommand from '../../structures/Commands/BaseCommand';
import CTX from '../../structures/Commands/CTX'
import { version } from '../../../package.json';
import time from 'ms';
import { RawUserData } from 'discord.js/typings/rawDataTypes';

export default class InfoCommand extends BaseCommand<boolean, false>{
    constructor() {
        super({
            name: "info",
            category: "util",
            description: "Displays information about the bot",
            allowGuildCommand: true,
            allowDMCommand: true,
            webhookPermsRequired: new Permissions(["USE_EXTERNAL_EMOJIS"])
        });
    }

    async run(ctx: CTX<boolean, false>) {
        const ownerUserStrings = [];
        const hasPermission = ctx.botPermissionsForChannel.has("USE_EXTERNAL_EMOJIS");
        for (const owner of owners) ownerUserStrings.push(await this.generateDisplayOwnerText(owner, hasPermission));

        const totalGuilds = await ctx.client.shard.fetchClientValues('guilds.cache.size').then((arr) =>
            arr.reduce((prev, cur) =>
                (prev as number) + (cur as number), 0)
        ).catch(this.client.logger.error) as number ?? 0;

        const infoEmbed = new MessageEmbed({
            author: {
                name: this.client.user.username,
                iconURL: this.client.user.avatarURL({ size: 64 }) || "https://cdn.discordapp.com/embed/avatars/2.png"
            },
            fields: [
                { name: "Version", value: version, inline: true },
                { name: "Library", value: "Discord.JS", inline: true },
                { name: "Made by", value: ownerUserStrings.join(", "), inline: true },
                { name: "Guilds", value: totalGuilds.toString(), inline: true },
                { name: "Commands", value: this.client.commands.size.toString(), inline: true },
                { name: "Invite", value: `**[Invite](${this.client.generateInvite(inviteGenerateOptions)})**`, inline: true }
            ],
            footer: {
                text: `Ririchiyo | Shard [${ctx.guild ? ctx.guild.shard.id + 1 : 0}/${this.client.shard.shardCount}] | Cluster [${this.client.shard.id + 1}/${this.client.shard.clusterCount}] | Uptime ${time(this.client.uptime || 0)}`
            },
            color: ThemeUtils.getClientColor(ctx.guild)
        })

        await ctx.reply({ embeds: [infoEmbed] }).catch(this.client.logger.error);
    }

    async generateDisplayOwnerText(owner: OwnerObject, hasPermission = false) {
        const fetchedData = await this.client.shard.fetchUser(owner.id).catch(this.client.logger.error) || null;
        const user = fetchedData ? new User(this.client, fetchedData as RawUserData) : null;
        return `**[${user?.username ?? owner.displayName}](${owner.clickableLink})** ${owner.emoji && hasPermission ? ` ${CustomEmojiUtils.get(owner.emoji)}` : ""}`;
    }

    slashCommandData: ApplicationCommandData = {
        name: this.name,
        description: this.description
    }
}


import { MessageEmbed, Permissions, User, UserResolvable } from 'discord.js';
import { inviteGenerateOptions, OwnerObject, owners } from '../../config';
import BaseCommand from '../../structures/Commands/BaseCommand';
import { MessageCTX, InteractionCTX } from '../../structures/Commands/CTX'
import { version } from '../../../package.json';
import { CustomEmojiUtils, ThemeUtils } from '../../structures/Utils';
import time from 'ms';

export default class InfoCommand extends BaseCommand {
    constructor() {
        super({
            name: "info",
            aliases: ['i', 'inf'],
            category: "util",
            description: "Displays information about the bot",
            allowSlashCommand: true,
            allowMessageCommand: true,
            allowGuildCommand: true,
            allowDMCommand: true,
            botPermsRequired: new Permissions(["USE_EXTERNAL_EMOJIS"])
        });
    }

    async run(ctx: MessageCTX | InteractionCTX) {
        const ownerUserStrings = [];
        for (const owner of owners) ownerUserStrings.push(await this.generateDisplayOwnerText(owner));

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

    async generateDisplayOwnerText(owner: OwnerObject) {
        const fetched = await this.client.users.fetch(owner.id).catch(this.client.logger.error) || null;
        return `**[${fetched?.username ?? owner.displayName}${owner.emoji ? " " + CustomEmojiUtils.get(owner.emoji).toString() : ""}](${owner.clickableLink})**`;
    }

    getUsage(p: string) {
        return `${p}info`
    }
}


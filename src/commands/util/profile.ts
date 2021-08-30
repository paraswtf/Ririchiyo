import {
    CustomEmojiUtils,
    ThemeUtils
} from '../../structures/Utils';
import {
    ApplicationCommandData,
    MessageEmbed,
    Permissions
} from 'discord.js';
import BaseCommand from '../../structures/Commands/BaseCommand';
import CTX from '../../structures/Commands/CTX'
import { APIGuild } from 'discord-api-types';

export default class ProfileCommand extends BaseCommand<boolean, false> {
    constructor() {
        super({
            name: "profile",
            category: "util",
            description: "View a user's profile",
            allowGuildCommand: true,
            allowDMCommand: true,
            webhookPermsRequired: new Permissions(["USE_EXTERNAL_EMOJIS"])
        });
    }

    async run(ctx: CTX<boolean, false>) {
        const user = ctx.options.getUser('user') ?? ctx.user;
        const userData = user.id === ctx.user.id ? ctx.userData : await this.client.db.getUser(user);

        const userFlagEmojis = user.flags?.toArray().map(f => CustomEmojiUtils.getForFlag(f)) ?? [];

        if (user.bot && !user.flags?.has('VERIFIED_BOT')) userFlagEmojis.push(CustomEmojiUtils.get('BOT'));

        const profileEmbed = new MessageEmbed({
            author: {
                name: `${user.username}${user.username.toLowerCase().endsWith('s') ? "'" : "'s"} profile`,
                iconURL: user.avatarURL({ size: 4096, format: 'png' }) ?? "https://cdn.discordapp.com/embed/avatars/4.png"
            },
            title: user.tag,
            description: userFlagEmojis.filter(e => !!e).join(" "),
            thumbnail: {
                url: user.avatarURL({ size: 4096, format: 'png' }) ?? "https://cdn.discordapp.com/embed/avatars/4.png"
            },
            color: ThemeUtils.getClientColor(ctx.guild)
        })

        if (userData.premium.latestRenewal) {
            const boostedGuildNames = [];
            for (const guildID of userData.premium.guilds) {
                const guild = await this.client.shard.fetchGuild(guildID).catch(this.client.logger.error) as APIGuild;
                boostedGuildNames.push(guild?.name ?? guildID)
            }
            profileEmbed.addField("Premium", `Valid till: ${new Date(userData.premium.latestRenewal.expiry).toUTCString()}
            Boosted Guilds: ${boostedGuildNames.length ? boostedGuildNames.join(", ") : "NONE"}
            Allowed Boosts: ${userData.premium.latestRenewal.allowedBoosts}`)
        }
        else profileEmbed.addField("Premium", "NOPE :/")

        return await ctx.reply({ embeds: [profileEmbed] });
    }

    slashCommandData: ApplicationCommandData = {
        name: this.name,
        description: this.description
    }
}

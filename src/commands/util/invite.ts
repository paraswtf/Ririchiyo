import {
    inviteGenerateOptions,
    support_server_url
} from '../../config';
import { EmbedUtils } from '../../structures/Utils';
import { ApplicationCommandData } from 'discord.js';
import BaseCommand from '../../structures/Commands/BaseCommand';
import CTX from '../../structures/Commands/CTX'

export default class InviteCommand extends BaseCommand<boolean, false>{
    constructor() {
        super({
            name: "invite",
            category: "util",
            description: "Displays the invite link for the bot",
            allowGuildCommand: true,
            allowDMCommand: true
        });
    }

    async run(ctx: CTX<boolean, false>) {
        await ctx.reply({
            embeds: [
                EmbedUtils.embedifyString(ctx.guild,
                    `**Add me to your server- [Invite](${this.client.generateInvite(inviteGenerateOptions)})**\n**Join my support server- [Styxo's Hideout](${support_server_url})**`
                )
            ]
        }).catch(this.client.logger.error);
    }

    slashCommandData: ApplicationCommandData = {
        name: this.name,
        description: this.description
    }
}


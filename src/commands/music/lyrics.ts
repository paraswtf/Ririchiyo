import { BaseCommand } from '../../structures/Commands/BaseCommand';
import { AllCTX } from '../../structures/Commands/CTX';
import { ApplicationCommandData, MessageEmbed, Permissions } from 'discord.js';
import { Track } from '@ksoft/api';
import Utils, { EmbedUtils, ThemeUtils } from '../../structures/Utils';

export default class LyricsCommand extends BaseCommand<boolean, false> {
    constructor() {
        super({
            name: "lyrics",
            category: "music",
            description: "View the lyrics for a song",
            allowGuildCommand: true,
            allowDMCommand: true,
            webhookPermsRequired: new Permissions(["USE_EXTERNAL_EMOJIS"])
        })
    }

    async run(ctx: AllCTX<false>) {
        const dispatcher = ctx.guild ? this.client.dispatchers.get(ctx.guild.id) : null;

        const query = ctx.options.get('query')?.value as string ?? dispatcher?.queue.current?.title;

        if (!query) return await ctx.reply({
            embeds: [EmbedUtils.embedifyString(ctx.guild, ctx.guild ? "There is nothing playing right now!" : "Please provide a query to search for", { isError: true })],
            ephemeral: true
        });

        const { lyrics, name, artist }: Partial<Track> = await this.client.searchResolver.ksoft.lyrics.get(query, { textOnly: false }).catch((err: Error) => {
            this.client.logger.error(err);
            return {};
        });

        const lyricsEmbed = new MessageEmbed();

        if (lyrics && name && artist && artist.name) {
            lyricsEmbed.setColor(ThemeUtils.getClientColor(ctx.guild))
                .setTitle(name).setDescription(`${artist.name}\n\n` + lyrics)
                .setFooter("Lyrics provided by KSoft.Si");
        }
        else {
            lyricsEmbed.setColor(ThemeUtils.colors.get('error').rgbNumber())
                .setDescription(`No lyrics found for **${Utils.escapeMarkdown(query)}**`)
                .setFooter("Lyrics provided by KSoft.Si");
        }

        if (lyricsEmbed.description?.length || 0 > 4096) lyricsEmbed.description = `${Utils.limitLength(lyricsEmbed.description!, { maxLength: 4096 })}`;

        await ctx.reply({ embeds: [lyricsEmbed] });
    }

    slashCommandData: ApplicationCommandData = {
        name: this.name,
        description: this.description,
        options: [
            {
                name: "query",
                description: "The song link or name to search for",
                type: "STRING",
                required: false
            }
        ]
    }
}

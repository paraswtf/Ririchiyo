import { MessageEmbed, Permissions } from 'discord.js';
import BaseCommand from '../../structures/Commands/BaseCommand';
import { MessageCTX, InteractionCTX } from '../../structures/Commands/CTX'
import { CustomEmojiUtils, ThemeUtils } from '../../structures/Utils';

export default class PingCommand extends BaseCommand {
    constructor() {
        super({
            name: "ping",
            category: "util",
            description: "Displays bot connection stats",
            allowSlashCommand: true,
            allowMessageCommand: true,
            allowGuildCommand: true,
            allowDMCommand: true,
            botPermsRequired: new Permissions(["USE_EXTERNAL_EMOJIS"])
        });
    }

    async run(ctx: MessageCTX | InteractionCTX) {
        let previousDate = Date.now();
        const pingEmbed = new MessageEmbed({
            title: `${CustomEmojiUtils.get("ping_pong")} Pinging...`,
            color: ThemeUtils.colors.get("loading")!.rgbNumber()
        })

        const pingMessage = await ctx.reply({ embeds: [pingEmbed] }).catch(this.client.logger.error);
        if (!pingMessage) return;

        //The delay between the message being recieved and the command execution
        const internalDelay = Math.round(previousDate - ctx.recievedAt);
        //The delay between the message being sent and it being recieved by the bot
        const restLatency = Math.round(Date.now() - ctx.recievedAt);
        //The previous heartbeat ping of the shard
        const wsPing = Math.round(ctx.message.createdTimestamp - ctx.recievedAt);
        //The client heartbeat interval
        const heartbeat = Math.round((ctx.message.guild?.shard || ctx.message.client.ws).ping);
        //The average ping of all WebSocketShards
        const clusterPing = Math.round(this.client.ws.ping);

        pingEmbed.setTitle(`${CustomEmojiUtils.get("ping_pong")} Pong!`)
            .setDescription(
                [
                    `**Rest latency:** \`${restLatency}ms\``,
                    `**WebSocket latency:** \`${wsPing}ms\``,
                    `**Internal delay:** \`${internalDelay}ms\``,
                    `**Heartbeat:** \`${heartbeat}ms\``,
                    `**Cluster avg:** \`${clusterPing}ms\``
                ].join("\n")
            )
            .setColor(ThemeUtils.colors.get("success")!.rgbNumber());
        await pingMessage.edit({ embeds: [pingEmbed] }).catch(this.client.logger.error);
    }

    getUsage(p: string) {
        return `${p}ping`
    }
}

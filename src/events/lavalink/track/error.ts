import { Player, Manager, Track, TrackExceptionEvent } from "../../../structures/Lavalink";
import BaseEvent from '../../../structures/Events/BaseEvent';

export class TrackErrorEvent extends BaseEvent<Manager> {
    constructor() {
        super({
            name: "trackError",
            category: "track",
        })
    }
    async run(manager: Manager, player: Player, track: Track, payload: TrackExceptionEvent) {
        // manager.playingMessages.deleteMessage(track.id);
        // await player.textChannel.send(Utils.embedifyString(player.guild, `**[${DiscordUtil.escapeMarkdown(track.displayTitle)}](${track.displayURL})**\n\`Added by - \`${track.requester}\` \`\nAn error occured while playing track: \`${payload?.error ?? "UNKNOWN_ERROR"}\``, true)).catch((err) => this.client.logger.error(err.message || err));
    };
}
export default TrackErrorEvent;

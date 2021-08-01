import BaseEvent from '../../structures/Events/BaseEvent';
import { ExtendedShoukakuPlayer } from '../../structures/Shoukaku/Dispatcher';
import { PlayerEndEvent as EventData } from 'shoukaku';
import { EmbedUtils } from '../../structures/Utils';
import { ResolvedTrack } from '../../structures/Shoukaku/RirichiyoTrack';
import { Playlist } from '../../structures/YouTube'

/** 
 * Emitted when the Lavalink Server sends a TrackEndEvent or TrackStuckEvent, MUST BE HANDLED.
 */
export default class PlayerEndEvent extends BaseEvent<ExtendedShoukakuPlayer> {
    constructor() {
        super({
            name: "end",
            category: "shoukakuPlayer",
        })
    }

    async run(player: ExtendedShoukakuPlayer, data: EventData) {
        if (player.dispatcher.queue.current) player.dispatcher.playingMessages.deleteMessage(player.dispatcher.queue.current.id);

        switch (data.reason) {
            case "FINISHED": {
                const endedTrack = player.dispatcher.queue.current as ResolvedTrack | undefined;
                player.dispatcher.queue.next();
                //If there is current then play.
                if (player.dispatcher.queue.current) await player.dispatcher.play();
                //If none then handle recommendation
                else if (endedTrack) {
                    if (!player.dispatcher.queue.recommendations.length) {
                        //get recommendations
                        const playlists = await player.dispatcher.client.searchResolver.youtube.searchPlaylists(endedTrack.title, 1).catch(player.dispatcher.client.logger.error) as Playlist[] | null;
                        if (playlists?.length && playlists[0].url) {
                            const shoukakuTrackList = await player.dispatcher.client.searchResolver.search({ query: playlists[0].url }).catch(player.dispatcher.client.logger.error);
                            if (shoukakuTrackList) player.dispatcher.queue.recommendations = (shoukakuTrackList.tracks as ResolvedTrack[])
                                //Shoukld not be same title
                                .filter(t => t.title !== endedTrack.title)
                                //Should not be too long or short
                                .filter(t => t.duration < 300000 && t.duration < 60000)
                                .filter(t => !/(react)(ion)?/.test(t.title));
                        }
                    }
                    //If there are recommendations
                    if (player.dispatcher.queue.recommendations.length) {
                        //Add to queue and play
                        player.dispatcher.queue.add(player.dispatcher.queue.recommendations.shift()!);
                        await player.dispatcher.play();
                    }
                }
                //If no track was added at the end
                if (!player.dispatcher.queue.current) player.dispatcher.sendMessage({
                    embeds: [
                        EmbedUtils.embedifyString(player.dispatcher.guild, "The player queue has ended.")
                    ]
                })
                break;
            }
            case "STOPPED": {
                if (!player.dispatcher.queue.current) player.dispatcher.sendMessage({
                    embeds: [
                        EmbedUtils.embedifyString(player.dispatcher.guild, "The player queue has ended.")
                    ]
                })
                break;
            }
        }
    }
}

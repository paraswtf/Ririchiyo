import { Player, Manager, Track } from "../../../structures/Lavalink";
import BaseEvent from '../../../structures/Events/BaseEvent';

export class TrackEndEvent extends BaseEvent<Manager> {
    constructor() {
        super({
            name: "trackEnd",
            category: "track",
        })
    }
    async run(manager: Manager, player: Player, track: Track) {
        //manager.playingMessages.deleteMessage(track.id);
    };
}
export default TrackEndEvent;

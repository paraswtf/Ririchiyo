import { Player, Manager, Track } from "../../../structures/Lavalink";
import BaseEvent from '../../../structures/Events/BaseEvent';

export class TrackStartEvent extends BaseEvent<Manager> {
    constructor() {
        super({
            name: "trackStart",
            category: "track",
        })
    }
    async run(manager: Manager, player: Player, track: Track) {
        //await manager.playingMessages.createMessage(player, track).send();
    };
}
export default TrackStartEvent;

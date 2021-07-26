import { ShoukakuPlayer } from 'shoukaku';
import BaseEvent from '../../structures/Events/BaseEvent';

export default class PlayerStartEvent extends BaseEvent<ShoukakuPlayer> {
    constructor() {
        super({
            name: "start",
            category: "shoukakuPlayer",
        })
    }

    async run(emitter: ShoukakuPlayer, data: any) {
        console.log(data);
    }
}

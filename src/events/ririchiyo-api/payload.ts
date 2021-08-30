import { inspect } from 'util';
import BaseEvent from '../../structures/Events/BaseEvent';
import { Payload } from '../../structures/RirichiyoAPI/API_typings';
import RirichiyoAPI from '../../structures/RirichiyoAPI/RirichiyoAPI';

export default class RirichiyoAPIPayloadEvent extends BaseEvent<RirichiyoAPI> {
    constructor() {
        super({
            name: "payload",
            category: "api",
        })
    }

    async run(api: RirichiyoAPI, payload: Payload) {
        if (payload.op === 'ping' || payload.op === 'pong') this.emitter.client.logger.debug(inspect(payload));
    }
}

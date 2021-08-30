import { inspect } from 'util';
import BaseEvent from '../../structures/Events/BaseEvent';
import { VotePayload } from '../../structures/RirichiyoAPI/API_typings';
import RirichiyoAPI from '../../structures/RirichiyoAPI/RirichiyoAPI';

export default class RirichiyoAPIVoteEvent extends BaseEvent<RirichiyoAPI> {
    constructor() {
        super({
            name: "vote",
            category: "api",
        })
    }

    async run(api: RirichiyoAPI, vote: VotePayload['data']) {
        if (api.client.shard.id !== 0) return;

        this.emitter.client.logger.debug(inspect(vote));
    }
}

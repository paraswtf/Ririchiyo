import BaseEvent from '../../structures/Events/BaseEvent';
import RirichiyoClient from '../../structures/RirichiyoClient';
import Guild from '../../structures/Data/classes/Guild';

export default class ClientGuildDeleteEvent extends BaseEvent<RirichiyoClient> {
    constructor() {
        super({
            name: "guildDelete",
            category: "client",
        })
    }

    async run(client: RirichiyoClient, guild: Guild) {
        if (client.dispatchers.has(guild.id)) client.dispatchers.destroy(guild.id);
    }
}

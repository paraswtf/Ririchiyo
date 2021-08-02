import BaseEvent from '../../structures/Events/BaseEvent';
import RirichiyoClient from '../../structures/RirichiyoClient';
import { CommandInteraction, Interaction, MessageComponentInteraction } from 'discord.js';

export default class ClientInteractionCreateEvent extends BaseEvent<RirichiyoClient> {
    constructor() {
        super({
            name: "interactionCreate",
            category: "client",
        })
    }

    async run(client: RirichiyoClient, interaction: Interaction) {
        switch (interaction.type) {
            case "APPLICATION_COMMAND":
                client.commandHandler.handleCommandInteraction(interaction as CommandInteraction, Date.now());
                break;
            case "MESSAGE_COMPONENT":
                client.commandHandler.handleComponentInteraction(interaction as MessageComponentInteraction, Date.now());
                break;
        }
    }
}

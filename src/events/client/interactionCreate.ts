import BaseEvent from '../../structures/Events/BaseEvent';
import RirichiyoClient from '../../structures/RirichiyoClient';
import { Interaction, MessageComponentInteraction } from 'discord.js';

export default class ClientInteractionCreateEvent extends BaseEvent<RirichiyoClient> {
    constructor() {
        super({
            name: "interactionCreate",
            category: "client",
        })
    }

    async run(emitter: RirichiyoClient, interaction: Interaction) {
        switch (interaction.type) {
            case "MESSAGE_COMPONENT":
                this.emitter.commandHandler.handleComponentInteraction(interaction as MessageComponentInteraction, Date.now());
                break;
            case "APPLICATION_COMMAND":
                //this.emitter.commandHandler.handleInteraction(interaction, Date.now());
                break;
            default:
                return;
        }
    }
}

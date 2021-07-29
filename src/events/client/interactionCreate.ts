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

    async run(emitter: RirichiyoClient, interaction: Interaction) {
        switch (interaction.type) {
            case "APPLICATION_COMMAND":
                this.emitter.commandHandler.handleCommandInteraction(interaction as CommandInteraction, Date.now());
                break;
        }
    }
}

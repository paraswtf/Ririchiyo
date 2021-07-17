import { Collection } from "discord.js";
import Guild from "./Guild";
import {
    GuildSettings,
    GuildSettingsData
} from "./GuildSettings"

export const defaultData = [];

export type GuildSettingsCollectionData = GuildSettingsData[]

export class GuildSettingsCollection extends Collection<string, GuildSettings> {
    // Class props //
    guild!: Guild;
    // Class props //

    constructor(entries?: readonly ([string, GuildSettings])[] | null, guild?: Guild) {
        super(entries);
        if (guild) this.guild = guild;
    }

    // constructor(guild: Guild) {
    //     this.guild = guild;
    //     this.settings = new Collection(this.guild.data.settings.map(
    //         ({ clientId }) => [clientId, new GuildSetting(this.guild, clientId)]
    //     ));
    // }

    get(clientId: string = this.guild.DB.client.user!.id) {
        //if no cached instance exists create one
        if (!super.has(clientId)) super.set(clientId, new GuildSettings(this.guild, clientId));
        return super.get(clientId)!;
    }
}

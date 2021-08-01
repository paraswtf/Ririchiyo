import Color from 'color';
import { Guild } from 'discord.js';
import { DefinedCollection } from '.';
import { colors } from "../../config";

export class ThemeUtils {
    public static readonly colors = new DefinedCollection(colors.map(c => [c.type, Color(c.hex, 'hex')]));

    /**
     * Get the displayed colour of the client in a guild.
     * @param guild A discord "Guild"
     * @param raw [false] Wether to return the raw color in the guild or default to the default colour 'general if none was returned from the guild
     */
    public static getClientColor(guild?: Guild | null, raw?: boolean) {
        if (!guild) return this.colors.get('general')!.rgbNumber();

        const clientMember = guild.members.resolve(guild.client.user!);
        if (!clientMember) throw new TypeError("Client is not a member of the guild.");

        const colour = clientMember.displayColor;
        return (!colour) && !raw ? this.colors.get('general')!.rgbNumber() : colour;
    }
}

export default ThemeUtils;

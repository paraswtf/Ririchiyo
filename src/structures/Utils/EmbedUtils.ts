import Color from "color";
import {
    ColorResolvable,
    Guild,
    MessageEmbed
} from "discord.js";
import ThemeUtils from "./ThemeUtils";


export class EmbedUtils {
    /**
     * Convert any text to a simple embed with the text as it's description.
     */
    public static embedifyString(guild: Guild | null, text: string, options: EmbedifyStringOptions = {}): MessageEmbed {
        return new MessageEmbed({
            color:
                (
                    typeof options.embedColour !== 'undefined'
                        ? Color(options.embedColour).rgbNumber()
                        : null
                )
                ??
                (
                    options.isError
                        ? ThemeUtils.colors.get('error')!.rgbNumber()
                        : ThemeUtils.getClientColor(guild)
                ),
            description: text
        });
    }
}

export interface EmbedifyStringOptions {
    isError?: boolean,
    embedColour?: ColorResolvable
}


export default EmbedUtils;

import Utils from '..';
import {
    Collection,
    Emoji,
    UserFlagsString
} from 'discord.js';
import {
    customEmojis,
    CustomEmojiName
} from '../../../config';


export class CustomEmojiUtils {
    /**
     * Class properties
     */
    public static readonly customEmojis = new Collection(customEmojis.map(e => [e.name, new Emoji(Utils.client, e)]));

    /**
     * Get a custom emoji using it's name
     * @param {string} name the name of the emoji
     */
    public static get(name: CustomEmojiName) {
        return this.customEmojis.get(name) ?? this.customEmojis.get("NOT_FOUND_EMOJI")!;
    }

    public static getForFlag(flag: UserFlagsString) {
        return this.customEmojis.get(flag as any) ?? null;
    }
}

export default CustomEmojiUtils;

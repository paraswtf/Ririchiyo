import Client from '../Client';
import { Snowflake } from '@sapphire/snowflake';

export class Utils {
    public static readonly client: Client;
    public static readonly snowflake = new Snowflake(new Date('2005-08-07T00:00:00.000Z'));

    /**
     * Initialize this class
     * @param {Client} client the discord.js bot client 
     */
    public static _init(client: Client) {
        return Object.assign(this, { client });
    }

    /**
    * Multiply a string by a number of times (like python "x"*n)
    * @param {number} times The number of times the string should be repeated in a string
    * @param {string} string The string to be repeated
    */
    public static multiplyString(times: number, string: string): string {
        return Array(times + 1).join(string);
    };

    /**
     * Convert the first letter of a string to caps
     * @param {string} string The string to change the first letter
     */
    public static firstLetterCaps(string: string): string {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}

export type ElementType<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<infer ElementType> ? ElementType : never;
export type ID = `${bigint}`;

export default Utils;

export * from './CustomEmojiUtils';
export * from './CustomError';
export * from './DirectMessageUtils';
export * from './EmbedUtils';
export * from './Logger';
export * from './PermissionUtils';
export * from './ThemeUtils';

import RirichiyoClient from '../RirichiyoClient';
import { Snowflake } from '@sapphire/snowflake';
import { Collection, Util as DCUtil } from 'discord.js';

export class Utils {
    public static readonly client: RirichiyoClient;
    public static readonly snowflake = new Snowflake(new Date('2005-08-07T00:00:00.000Z'));

    /**
     * Initialize this class
     * @param {RirichiyoClient} client the discord.js bot client 
     */
    public static _init(client: RirichiyoClient) {
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

    /**
    * Insert variables in a template string, returns a new string
    * @param {string} template The template string
    * @param {any[]} args The arguments to add to the string
    */
    public static formatString(template: string, ...args: any[]) {
        return template.substr(0).replace(/\{\{|\}\}|\{(\d+)\}/g, (m, n) => {
            if (m === "{{") return "{";
            if (m === "}}") return "}";
            return args[n];
        });
    };

    /**
    * Escape markdown
    * @param {string} string The string to escape markdown from
    */
    public static escapeMarkdown(string: string) {
        return DCUtil.escapeMarkdown(string).replace(/[\[\]\(\)]/g, " ").replace(/\s+/g, " ");
    }

    /**
     * Limit the length of a string to a specified value and optionally append it with some characters
     * @param string The string to limit length of
     * @param opts Options
     */
    public static limitLength(text: string, { maxLength = 2000, splitAt = '\n', prepend = '', append = '...' }: LimitLengthOpts = {}): string {
        if (typeof text !== 'string') throw new TypeError("The provided value for 'text' is not a 'String'");
        if (typeof maxLength !== 'number') throw new TypeError("The provided value for 'maxLength' is not a 'Number'");
        return DCUtil.splitMessage(text, { maxLength, char: splitAt, prepend, append })[0];
    };

    /**
     * Generate a buttonID for discord
     * Looks like loop-q:a:n-2132321332112
     * @param command The name of the command to run
     * @param args The arguments to pass the command
     */
    public static generateButtonID(command: string, args?: string[]): string {
        const test = `${command}-${args ? args.join(':') : 'null'}-${this.snowflake.generate()}${Math.random().toFixed(5).toString().split(".")[1]}`;
        console.log(test);
        return test;
    };

    /**
     * Generate a buttonID for discord
     * @param command The name of the command to run
     * @param args The arguments to pass the command
     */
    public static decodeButtonID(buttonID: string): { id: string, commandName: string, args: string[] | null } | null {
        const splitID = buttonID.split('-');
        if (splitID.length !== 3) return null;
        return {
            id: splitID[2],
            commandName: splitID[0],
            args: splitID[1] === 'null' ? null : splitID[1].split(':')
        };
    };

    /**
     * Remove an element from an array with a given value
     * @param value The value to remove
     */
    public static removeKnownElement<T extends Array<unknown>>(array: T, value: ElementType<T>): ElementType<T> | null {
        if (!array.includes(value)) return null;
        return array.splice(array.indexOf(value), 1)[0] as ElementType<T>;
    };
}

export class DefinedCollection<K, V> extends Collection<K, V>{
    get(key: K) {
        return super.get(key)!;
    }
}

export type ElementType<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<infer ElementType> ? ElementType : never;
interface LimitLengthOpts {
    maxLength?: number;
    splitAt?: string;
    prepend?: string;
    append?: string;
}

export default Utils;

export * from './ui/CustomEmojiUtils';
export * from './CustomError';
export * from './ui/DirectMessageUtils';
export * from './ui/EmbedUtils';
export * from './Logger';
export * from './PermissionUtils';
export * from './ui/ThemeUtils';

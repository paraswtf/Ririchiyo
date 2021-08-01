import { Message } from 'discord.js';
import { ShardClientUtil as CustomShardClientUtil } from '../src/structures/Sharder';


export interface BasePreviousResponse {
    responseMessage?: Message
}

export interface EvalPreviousResponse extends BasePreviousResponse {
    responseMessage: Message
}

export type PreviousResponse =
    | EvalPreviousResponse

export class ExtendedMessage {
    previousCommandResponse?: PreviousResponse
}

declare module 'discord.js' {
    //Extend the ShardClientUtil
    interface ShardClientUtil extends Omit<CustomShardClientUtil, 'client'> { }
    //Extend the message for edited command support
    interface Message extends ExtendedMessage { }
}

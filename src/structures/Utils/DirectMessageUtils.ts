import Utils from '.';
import {
    Message,
    MessageOptions,
    MessagePayload,
    UserResolvable
} from 'discord.js';
import CustomError from './CustomError';


export class DirectMessageUtils {

    /**
     * Handle sending direct messages to users
     * @param messageToBeSent The message to be sent either String or Embed
     * @param user user whom to send the DM
     * @param altUser user whom to send the DM in case of an error to send the DM to the original user
     */
    public static async send(messageToBeSent: string | MessagePayload | MessageOptions, user: UserResolvable, altUser?: UserResolvable): Promise<DMResult> {
        try {
            const resolvedUser = Utils.client.users.resolve(user);
            if (!resolvedUser) return { success: false, error: new CustomError("User not found.") };
            return { success: true, message: await resolvedUser.send(messageToBeSent) };
        }
        catch (error) {
            return altUser ? this.send(messageToBeSent, altUser) : { success: false, error: new CustomError(error) };
        }
    }
}

export type DMResult =
    | { success: true, message: Message }
    | { success: false, error: CustomError }

export default DirectMessageUtils;

import { support_server_url } from '../';

export const EN = {
    COMMAND_ERROR: `There was an error executing that command, please try again.\nIf this error persists, please report this issue on our support server- [ririchiyo.xyz/support](${support_server_url})`,
    COMMAND_RATELIMITED: "Please wait ${0} more seconds before reusing the \`${1}\` command.",
    COMMAND_OWNER_ONLY: "This command can only be used by the bot owners!",
    NOTHING_PLAYING: "There is nothing playing right now!",
    VOICE_DISCONNECTED: "I'm not connected to a voice channel, use /summon to connect me to a voice channel!",
    NEED_TO_BE_IN_VC: "You need to be in a voice channel to use that command!",
    ALREADY_PLAYING_YOUR_VC: "Already playing your channel!",
    ALREADY_PLAYING_DIFFERENT_VC: "Already playing in a different channel!",
    NEED_TO_BE_IN_SAME_VC: "You need to be in the same voice channel as the bot to use that command!",
    MISSING_PLAYER_PERMISSIONS_MESSAGE: "You don't have the following permissions to perform that action!\n${0}\nBeing alone in a voice channel with the bot works too."

} as const;

export type Language = typeof EN;

export default EN;

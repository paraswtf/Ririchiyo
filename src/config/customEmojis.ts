//This is a TS file because I need typedefs for the emojis
import { ElementType } from "../structures/Utils";

export const customEmojis = [
    {
        "name": "NOT_FOUND_EMOJI",
        "id": "869687005313892412",
        "animated": false
    },
    {
        "name": "ANIMATED_CHECK_MARK_GREEN",
        "id": "869683723929550858",
        "animated": true
    },
    {
        "name": "ANIMATED_CROSS_MARK_RED",
        "id": "869683686235336745",
        "animated": true
    },
    {
        "name": "PANDA_CODING_ANIMATED",
        "id": "870337400184926218",
        "animated": true
    },
    {
        "name": "ANIMATED_PLAYING",
        "id": "869684437049278525",
        "animated": true
    },
    {
        "name": "ARROW_LEFT_BUTTON",
        "id": "869682542004035665",
        "animated": false
    },
    {
        "name": "ARROW_RIGHT_BUTTON",
        "id": "869682487025102899",
        "animated": false
    },
    {
        "name": "RELOAD_BUTTON",
        "id": "871546544279662633",
        "animated": false
    },
    {
        "name": "LOOP_DISABLED_BUTTON",
        "id": "869680667850600479",
        "animated": false
    },
    {
        "name": "LOOP_QUEUE_BUTTON",
        "id": "869680668274229318",
        "animated": false
    },
    {
        "name": "LOOP_TRACK_BUTTON",
        "id": "869680668316147742",
        "animated": false
    },
    {
        "name": "MUSICAL_NOTE",
        "id": "869682300051390524",
        "animated": false
    },
    {
        "name": "MUSICAL_NOTES",
        "id": "869682299933974608",
        "animated": false
    },
    {
        "name": "QUEUE_LIST",
        "id": "871667443527974932",
        "animated": false
    },
    {
        "name": "NEXT_BUTTON",
        "id": "869680668240670750",
        "animated": false
    },
    {
        "name": "PAUSE_BUTTON",
        "id": "869680668274196481",
        "animated": false
    },
    {
        "name": "PLAY_OR_PAUSE_BUTTON",
        "id": "869682300051415070",
        "animated": false
    },
    {
        "name": "PREVIOUS_BUTTON",
        "id": "869680668181930035",
        "animated": false
    },
    {
        "name": "RESUME_BUTTON",
        "id": "869680668131610675",
        "animated": false
    },
    {
        "name": "SHUFFLE_BUTTON",
        "id": "869680668173553684",
        "animated": false
    },
    {
        "name": "STOP_BUTTON",
        "id": "869682300118507541",
        "animated": false
    },
    {
        "name": "TEXT_CHANNEL",
        "id": "869682299615211541",
        "animated": false
    },
    {
        "name": "TEXT_CHANNEL_LOCKED",
        "id": "869682300043018241",
        "animated": false
    },
    {
        "name": "TEXT_CHANNEL_LOCKED_RED",
        "id": "869682299497766973",
        "animated": false
    },
    {
        "name": "VOICE_CHANNEL",
        "id": "869682299929755659",
        "animated": false
    },
    {
        "name": "VOICE_CHANNEL_LOCKED",
        "id": "869682300093341817",
        "animated": false
    },
    {
        "name": "VOICE_CHANNEL_LOCKED_RED",
        "id": "869682300093341817",
        "animated": false
    },
    {
        "name": "PING_PONG",
        "id": "869691029350125578",
        "animated": false
    },
    {
        "name": "BOT",
        "id": "878875694858403870",
        "animated": false
    },
    {
        "name": "BUGHUNTER_LEVEL_1",
        "id": "878875694522847344",
        "animated": false
    },
    {
        "name": "BUGHUNTER_LEVEL_2",
        "id": "878875694921285662",
        "animated": false
    },
    {
        "name": "DISCORD_CERTIFIED_MODERATOR",
        "id": "878875694845808700",
        "animated": false
    },
    {
        "name": "DISCORD_EMPLOYEE",
        "id": "878875694694801440",
        "animated": false
    },
    {
        "name": "EARLY_SUPPORTER",
        "id": "878875694917091378",
        "animated": false
    },
    {
        "name": "EARLY_VERIFIED_BOT_DEVELOPER",
        "id": "878875694682214422",
        "animated": false
    },
    {
        "name": "HOUSE_BALANCE",
        "id": "878875695282012180",
        "animated": false
    },
    {
        "name": "HOUSE_BRAVERY",
        "id": "878875694854197258",
        "animated": false
    },
    {
        "name": "HOUSE_BRILLIANCE",
        "id": "878875694803865650",
        "animated": false
    },
    {
        "name": "HYPESQUAD_EVENTS",
        "id": "878875694845788251",
        "animated": false
    },
    {
        "name": "NITRO_SUBSCRIBER",
        "id": "878875695026159616",
        "animated": false
    },
    {
        "name": "PARTNERED_SERVER_OWNER",
        "id": "878875694875152394",
        "animated": false
    },
    {
        "name": "VERIFIED_BOT",
        "id": "878875694849994822",
        "animated": false
    }
] as const;

//Create types for emoji names
export type CustomEmoji = ElementType<typeof customEmojis>;
export type CustomEmojiName = CustomEmoji['name'];
export default customEmojis;

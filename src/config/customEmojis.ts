//This is a TS file because I need typedefs for the emojis
import { ElementType } from "../structures/Utils";

export const customEmojis = [
    {
        "name": "404",
        "id": "813250808522604544",
        "animated": false
    },
    {
        "name": "error",
        "id": "815454892767576075",
        "animated": false
    },
    {
        "name": "restricted",
        "id": "797853430638968832",
        "animated": false
    },
    {
        "name": "reset",
        "id": "811811200098238514",
        "animated": false
    },
    {
        "name": "warn",
        "id": "797855064810455050",
        "animated": false
    },
    {
        "name": "info",
        "id": "815425338876231720",
        "animated": false
    },
    {
        "name": "animated_loading",
        "id": "815444831756877845",
        "animated": true
    },
    {
        "name": "success",
        "id": "815455691598200903",
        "animated": false
    },
    {
        "name": "online",
        "id": "797853430541451264",
        "animated": false
    },
    {
        "name": "idle",
        "id": "797853430873980948",
        "animated": false
    },
    {
        "name": "dnd",
        "id": "797853430226878525",
        "animated": false
    },
    {
        "name": "offline",
        "id": "797853430533849088",
        "animated": false
    },
    {
        "name": "ping_pong",
        "id": "797853964061769748",
        "animated": false
    },
    {
        "name": "hourglass",
        "id": "815447178318446613",
        "animated": false
    },
    {
        "name": "stopwatch",
        "id": "815447178490150952",
        "animated": false
    },
    {
        "name": "heartbeat",
        "id": "815447178259464202",
        "animated": false
    },
    {
        "name": "like",
        "id": "797857521304862720",
        "animated": false
    },
    {
        "name": "shuffle",
        "id": "797857520848076832",
        "animated": false
    },
    {
        "name": "previous_track",
        "id": "797857521025024031",
        "animated": false
    },
    {
        "name": "play_or_pause",
        "id": "797857521573691462",
        "animated": false
    },
    {
        "name": "next_track",
        "id": "797857520973512706",
        "animated": false
    },
    {
        "name": "loop",
        "id": "797857521237753940",
        "animated": false
    },
    {
        "name": "stop",
        "id": "797857521297522738",
        "animated": false
    },
    {
        "name": "disconnect",
        "id": "797855294713233468",
        "animated": false
    },
    {
        "name": "arrow_up",
        "id": "797855294712709160",
        "animated": false
    },
    {
        "name": "arrow_down",
        "id": "797855294792269854",
        "animated": false
    },
    {
        "name": "arrow_left",
        "id": "797855294456725506",
        "animated": false
    },
    {
        "name": "arrow_right",
        "id": "797855294558044181",
        "animated": false
    },
    {
        "name": "musical_note",
        "id": "797855786465361952",
        "animated": false
    },
    {
        "name": "musical_notes",
        "id": "797855786705485824",
        "animated": false
    },
    {
        "name": "animated_playing",
        "id": "815811250940018709",
        "animated": true
    },
    {
        "name": "voice_channel_icon_normal",
        "id": "797856559752413274",
        "animated": false
    },
    {
        "name": "voice_channel_icon_normal_locked",
        "id": "797856559827910726",
        "animated": false
    },
    {
        "name": "voice_channel_icon_error_locked",
        "id": "797856559639691304",
        "animated": false
    },
    {
        "name": "text_channel_icon_normal",
        "id": "797856559711256606",
        "animated": false
    },
    {
        "name": "text_channel_icon_normal_locked",
        "id": "797856559592898600",
        "animated": false
    },
    {
        "name": "text_channel_icon_error_locked",
        "id": "797856559598010368",
        "animated": false
    },
    {
        "name": "animated_panda_happy",
        "id": "797854407911800853",
        "animated": true
    }
] as const;

//Create types for emoji names
export type CustomEmoji = ElementType<typeof customEmojis>;
export type CustomEmojiName = CustomEmoji['name'];
export default customEmojis;

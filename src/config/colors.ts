//This is a TS file because I need typedefs for the colors
import { ElementType } from "../structures/Utils";

export const colors = [
    {
        type: "general",
        hex: "#E535FF"
    },
    {
        type: "error",
        hex: "#FF0000"
    },
    {
        type: "restricted",
        hex: "#FFAA00"
    },
    {
        type: "warn",
        hex: "#FFD030"
    },
    {
        type: "info",
        hex: "#46A0FF"
    },
    {
        type: "loading",
        hex: "#FFCC00"
    },
    {
        type: "success",
        hex: "#2ECC71"
    }
] as const

//Create types for color types
export type ColorOBJ = ElementType<typeof colors>;
export type ColorType = ColorOBJ['type'];
export default colors;

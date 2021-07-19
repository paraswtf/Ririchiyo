export class DBUtils {
    public static join(...paths: string[]) {
        return paths.filter(s => !!s).join(".");
    }
}

export const emptyStringFilter = (s: string) => !!s

export default DBUtils;

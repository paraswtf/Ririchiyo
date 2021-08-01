import { UpdateQuery } from "mongodb";
import dot from 'dot-prop';
import Guild from "./classes/Guild";

export class DBUtils {
    public static join(...paths: string[]) {
        return paths.filter(s => !!s).join(".");
    }
}

export const emptyStringFilter = (s: string) => !!s

export abstract class BaseData {
    readonly abstract guild: Guild;
    readonly abstract dbPath: string;
    protected async updateDB(path: string, value: any, op: keyof UpdateQuery<any> = "$set") {
        return await this.guild.db.collections.guilds.updateOne(this.guild.query, {
            [op]: { [DBUtils.join(this.dbPath, path)]: value }
        }, { upsert: true });
    }
    protected updateCache(path: string, value: any, op: "set" | "delete" = "set") {
        return dot[op](this.guild.data, DBUtils.join(this.dbPath, path), value);
    }
    protected getCache<T>(path: string, defaultValue: T): T {
        return dot.get(this.guild.data, DBUtils.join(this.dbPath, path), defaultValue);
    }
}

export default DBUtils;

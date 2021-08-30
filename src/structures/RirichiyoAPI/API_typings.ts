export type PayloadOP =
    //For ping
    | "ping"
    //This is for stats IDK
    | "stats"
    //This is for basically everything
    | "apiEvent"

export interface PingPayload {
    readonly op: "ping",
    readonly data: "Send pong pls :/"
}

export interface PongPayload {
    readonly op: "pong",
    readonly data: string
}

export interface StatsPayload {
    readonly op: "stats",
    readonly data: Partial<APIStats>
}

export interface VotePayload {
    readonly op: "vote",
    readonly data: {
        site: "TOPGG" | "DBL",
        userID: string,
        isEvent: boolean
    }
}

export interface UnknownPayload {
    readonly op: "unknown",
    readonly data: any
}

export type Payload =
    | PingPayload
    | PongPayload
    | StatsPayload
    | VotePayload
    | APIEventPayload
    | UnknownPayload

export interface APIStats {
    readonly totalPlayers: number,
}

export interface APIEventPayload {
    readonly op: "apiEvent",
    readonly data: APIEvent
}

export interface APIEvent_GUILD_DELETE {
    readonly event: "GUILD_DELETE";
    //This is the deleted guild data
    readonly payload: { id: string };
}

export type APIEvent =
    | APIEvent_GUILD_DELETE


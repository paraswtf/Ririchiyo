import { Collection, Guild, GuildMember, StageChannel, TextChannel, VoiceChannel } from "discord.js";
import { ShoukakuGroupedFilterOptions, ShoukakuPlayer, ShoukakuPlayOptions, ShoukakuTrack, ShoukakuTrackList } from "shoukaku";
import RirichiyoClient from "../RirichiyoClient";
import Utils, { CustomError, ID } from "../Utils";
import Queue, { QueueLoopState } from "./Queue";
import { ResolvedTrack, RirichiyoTrack } from "./RirichiyoTrack";

export class DispatcherManager extends Collection<ID, Dispatcher>{
    constructor(entries?: readonly ([ID, Dispatcher])[] | null) {
        super(entries);
    }

    async create(options: DispatcherCreateOptions) {
        if (this.has(options.guildID)) return this.get(options.guildID)!;

        const dispatcher = await new Dispatcher(options).init(options);
        this.set(options.guildID, dispatcher);
        return dispatcher;
    }

    async destroy(guildID: ID) {
        this.get(guildID)?.player.disconnect();
        return this.delete(guildID);
    }
}

export class Dispatcher {
    //Important values
    readonly client: RirichiyoClient;
    readonly guild: Guild;
    textChannel: (TextChannel & { guild: Guild }) | null = null;
    //The shoukaku player
    readonly player!: ShoukakuPlayer;
    //The dispatcher queue
    readonly queue: Queue;

    //If the player is currently streaming audio
    get playing(): boolean {
        return !!this.player?.track && !this.player.paused;
    }

    constructor(options: DispatcherOptions) {
        this.client = Utils.client;
        //Resolve and set the guild
        const guild = this.client.guilds.resolve(options.guildID);
        if (!guild) throw new CustomError("Guild not found, cannot create a dispatcher.");
        this.guild = guild;

        //Resolve and set the text channel
        if (options.textChannelID) this.textChannel = this.guild.channels.resolve(options.textChannelID) as this['textChannel'];

        //Initialize player related values
        this.queue = new Queue();
    }

    async init(options: DispatcherCreateOptions) {
        Object.assign(this, {
            player: await this.client.shoukaku.getNode()
                .joinVoiceChannel({
                    guildID: this.guild.id,
                    voiceChannelID: options.voiceChannelID,
                    mute: false,
                    deaf: options.deaf ?? true
                }).then(p => p.setGroupedFilters(options.filterOptions)).catch(e => { throw new CustomError(e) })
        });
        if (options.loopState) this.queue.setLoopState(options.loopState);
        return this;
    }

    async attemptReconnect(voiceChannelID: ID, forceReconnect = false) {
        return await this.player.voiceConnection.attemptReconnect({ voiceChannelID, forceReconnect });
    }

    async playTrack(track: string | ShoukakuTrack, options?: ShoukakuPlayOptions) {
        if (!this.player) return new CustomError("The player does not exist for some reason... You sure bruh?");
        return await this.player.playTrack(track, options);
    }

    async play(options?: ShoukakuPlayOptions) {
        if (!this.player) return new CustomError("The player does not exist for some reason... You sure bruh?");
        if (!this.queue.current) return;
        const track = this.queue.current.isResolved ? this.queue.current : await this.queue.current.resolve()
        return await this.player.playTrack(track.base64, options);
    }

    async search(query: string, member: GuildMember, returnSearchList = false): Promise<SearchRes | null> {
        const res = await this.client.shoukaku.getNode().rest.resolve(query, "youtubemusic").catch(this.client.logger.error);
        if (!res) return null;

        switch (res.type) {
            case "SEARCH":
                return Object.assign({}, res, { tracks: returnSearchList ? res.tracks.map(t => new RirichiyoTrack(t, member) as ResolvedTrack) : [new RirichiyoTrack(res.tracks[0], member) as ResolvedTrack] });

            case "TRACK":
                return Object.assign({}, res, { tracks: [new RirichiyoTrack(res.tracks[0], member) as ResolvedTrack] });

            case "PLAYLIST":
                return Object.assign({}, res, { tracks: res.tracks.map(t => new RirichiyoTrack(t, member) as ResolvedTrack) });

            default:
                return Object.assign({}, res, { tracks: res.tracks?.map(t => new RirichiyoTrack(t, member) as ResolvedTrack) ?? [] });
        }
    }
}

export type SearchRes = Omit<ShoukakuTrackList, 'tracks'> & {
    tracks: ResolvedTrack[]
}

export interface DispatcherOptions {
    guildID: ID,
    textChannelID?: ID
}

export interface DispatcherCreateOptions {
    guildID: ID,
    textChannelID?: ID,
    voiceChannelID: ID,
    filterOptions?: ShoukakuGroupedFilterOptions,
    loopState?: QueueLoopState,
    deaf?: boolean
}

export default Dispatcher;

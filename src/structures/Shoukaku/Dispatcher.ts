import { Collection, Guild, GuildMember, StageChannel, TextChannel, VoiceChannel } from "discord.js";
import { join } from "path";
import { ShoukakuGroupedFilterOptions, ShoukakuPlayer, ShoukakuPlayOptions, ShoukakuTrack, ShoukakuTrackList } from "shoukaku";
import { GuildCTX } from "../Commands/CTX";
import Events from "../Events/Events";
import RirichiyoClient from "../RirichiyoClient";
import Utils, { CustomError, ID } from "../Utils";
import PlayingMessageManager from "../Utils/PlayingMessageManager";
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
    textChannel: (TextChannel & { guild: Guild });
    //The shoukaku player
    readonly player!: ShoukakuPlayer;
    //The dispatcher queue
    readonly queue: Queue;
    //The playing message manager
    readonly playingMessages = new PlayingMessageManager(null, this);
    //The first ctx in case the player joined via the play command and requires a message reply to that message
    firstCtx?: GuildCTX;
    // //Handle errors
    // private readonly errors: Collection<string, Collection<string, number>> = new Collection();

    //If the player is currently streaming audio
    get playing(): boolean {
        return !!this.player?.track && !this.player.paused;
    }

    constructor(options: DispatcherOptions, firstCtx?: GuildCTX) {
        this.client = Utils.client;
        this.firstCtx = firstCtx;
        //Resolve and set the guild
        const guild = this.client.guilds.resolve(options.guildID);
        if (!guild) throw new CustomError("Guild not found, cannot create a dispatcher.");
        this.guild = guild;

        //Resolve and set the text channel
        this.textChannel = this.guild.channels.resolve(options.textChannelID) as this['textChannel'];
        if (!this.textChannel) throw new CustomError("TextChannel not found, cannot create a dispatcher.");

        //Initialize player related values
        this.queue = new Queue();
    }

    async init(options: DispatcherCreateOptions) {
        const player = await this.client.shoukaku.getNode().joinVoiceChannel({
            guildID: this.guild.id,
            voiceChannelID: options.voiceChannelID,
            mute: false,
            deaf: options.deaf ?? true
        }).then(p => p.setGroupedFilters(options.filterOptions)).catch(e => { throw new CustomError(e) });
        Object.assign(this, {
            player: Object.assign(player, {
                dispatcher: this,
                events: new Events(null, player, this.client.logger).load(join(__dirname, "../../events/player"))
            })
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
        const res = await this.client.shoukaku.getNode().rest.resolve(query, "youtube").catch(this.client.logger.error);
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

    // checkErrorRatelimit(type: string) {
    //     if (!this.errors.has(type)) this.errors.set(type, new Collection())

    //     const errorsForType = this.errors.get(type);
    //     const maxErrorsPer10Seconds = this.maxErrorsPer10Seconds || 2;

    //     if (errorsForType.has(player.guild.id)) {
    //         let numberOfErrors = errorsForType.get(player.guild.id) || 0;

    //         if (numberOfErrors + 1 >= maxErrorsPer10Seconds) {
    //             return true;
    //         }
    //         else errorsForType.set(player.guild.id, ++numberOfErrors);
    //     }
    //     else {
    //         errorsForType.set(player.guild.id, 1);
    //         setTimeout(() => errorsForType.delete(player.guild.id), 10000);
    //     }
    // }
}

export type SearchRes = Omit<ShoukakuTrackList, 'tracks'> & {
    tracks: ResolvedTrack[]
}

export interface DispatcherOptions {
    guildID: ID,
    textChannelID: ID
}

export interface DispatcherCreateOptions {
    guildID: ID,
    textChannelID: ID,
    voiceChannelID: ID,
    filterOptions?: ShoukakuGroupedFilterOptions,
    loopState?: QueueLoopState,
    deaf?: boolean
}

export interface ExtendedShoukakuPlayer extends ShoukakuPlayer {
    dispatcher: Dispatcher,
    events: Events
}

export default Dispatcher;

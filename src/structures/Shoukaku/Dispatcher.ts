import { Collection, Guild, GuildMember, StageChannel, TextChannel, VoiceChannel } from "discord.js";
import { join } from "path";
import { ShoukakuGroupedFilterOptions, ShoukakuPlayer, ShoukakuPlayOptions, ShoukakuTrack, ShoukakuTrackList } from "shoukaku";
import { GuildCTX } from "../Commands/CTX";
import { Guild as GuildData } from "../Data/classes/Guild";
import { GuildSettings } from "../Data/classes/Guild/settings";
import Events from "../Events/Events";
import RirichiyoClient from "../RirichiyoClient";
import Utils, { CustomError, ID, PermissionUtils } from "../Utils";
import PlayingMessageManager from "../Utils/PlayingMessageManager";
import Queue, { QueueLoopState } from "./Queue";
import { ResolvedTrack, RirichiyoTrack } from "./RirichiyoTrack";
import { PlayerExceptionEvent } from 'shoukaku';

//Max exception ratelimit
const maxErrorsPer10Seconds = 3;

export class DispatcherManager extends Collection<ID, Dispatcher>{
    constructor(entries?: readonly ([ID, Dispatcher])[] | null) {
        super(entries);
    }

    async create(options: DispatcherCreateOptions) {
        if (this.has(options.guild.id)) return this.get(options.guild.id)!;

        const dispatcher = await new Dispatcher(options).init(options);
        this.set(options.guild.id, dispatcher);
        return dispatcher;
    }

    async destroy(guildID: ID) {
        const dispatcher = this.get(guildID);
        dispatcher?.player.disconnect();
        if (dispatcher?.queue.current) dispatcher.playingMessages.deleteMessage(dispatcher.queue.current.id);
        // dispatcher?.inactivityChecker.stop();
        return this.delete(guildID);
    }
}

export class Dispatcher {
    //Important values
    readonly client: RirichiyoClient;
    readonly guild: Guild;
    readonly guildData: GuildData;
    readonly guildSettings: GuildSettings;
    textChannel: (TextChannel & { guild: Guild });
    //The shoukaku player
    readonly player!: ShoukakuPlayer;
    //The dispatcher queue
    readonly queue: Queue;
    //The playing message manager
    readonly playingMessages = new PlayingMessageManager(null, this);
    //The first ctx in case the player joined via the play command and requires a message reply to that message
    firstCtx?: GuildCTX;
    //Handle errors
    private readonly errors: Collection<PlayerExceptionEvent['exception']['severity'], number> = new Collection();
    //The inactivity checker for the dispatcher
    readonly inactivityChecker: InactivityChecker;

    constructor(options: DispatcherOptions, firstCtx?: GuildCTX) {
        this.client = Utils.client;
        this.firstCtx = firstCtx;
        this.guild = options.guild;
        this.guildData = options.guildData;
        this.guildSettings = options.guildSettings;
        this.textChannel = options.textChannel;

        //Initialize player related values
        this.queue = new Queue();
        //The inactivity checker for the dispatcher
        this.inactivityChecker = new InactivityChecker(this);
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

    async play(options?: ShoukakuPlayOptions) {
        if (!this.queue.current) return;
        const track = this.queue.current.isResolved ? this.queue.current : await this.queue.current.resolve()
        return await this.player.playTrack(track.base64, options);
    }

    async search(query: string, member: GuildMember, returnSearchList = false): Promise<SearchRes | null> {
        const res = await this.client.shoukaku.getNode().rest.resolve(query + "lyric video", "youtube").catch(this.client.logger.error);
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

    async sendMessage(options: Parameters<this['textChannel']['send']>['0']) {
        if (this.firstCtx) {
            const res = await PermissionUtils.handlePermissionsForChannel(this.firstCtx.channel, {
                userToDM: this.firstCtx.guild.ownerId,
                channelToSendMessage: this.firstCtx.channel as TextChannel
            });

            if (!res.hasAll) return;

            const msg = await this.firstCtx.reply(options).catch(this.client.logger.error);

            delete this.firstCtx;
            return msg;

        }
        else {
            const res = await PermissionUtils.handlePermissionsForChannel(this.textChannel, {
                userToDM: this.guild.ownerId,
                channelToSendMessage: this.textChannel
            });

            if (!res.hasAll) return;

            return await this.textChannel.send(options).catch(this.client.logger.error);
        }
    }

    checkErrorRatelimitted(severity: PlayerExceptionEvent['exception']['severity']) {
        if (this.errors.has(severity)) {
            let numberOfErrors = this.errors.get(severity) ?? 0;
            if (numberOfErrors + 1 >= maxErrorsPer10Seconds) return true;
            else this.errors.set(severity, ++numberOfErrors);
        } else {
            this.errors.set(severity, 1);
            setTimeout(() => this.errors.delete(severity), 10000);
        }
        return false;
    }
}

export class InactivityChecker {
    // Class props //
    private _stop: boolean = false;
    private times = 0;
    dispatcher: Dispatcher;
    // Class props //

    constructor(dispatcher: Dispatcher) {
        this.dispatcher = dispatcher;
        this.run();
    }

    private run() {
        if (!this._stop && !(this.dispatcher.guildSettings.music.stayConnected && this.dispatcher.guildData.premium.isValid)) {
            if (!this.dispatcher.queue.current || this.dispatcher.player.paused || (
                this.dispatcher.player.voiceConnection.voiceChannelID
                    ? ((this.dispatcher.guild.channels.resolve(this.dispatcher.player.voiceConnection.voiceChannelID)?.members as Collection<ID, GuildMember>).filter(m => !m.user.bot).size ?? 0) < 1
                    : true
            )) this.times > 1 ? this.dispatcher.player.emit("playerInactivity") : ++this.times;
        }
        else this.times = 0;
        if (!this._stop) setTimeout(() => this.run(), 600000);
    }

    public stop() {
        this._stop = true;
    }
}

export type SearchRes = Omit<ShoukakuTrackList, 'tracks'> & {
    tracks: ResolvedTrack[]
}

export interface DispatcherOptions {
    guild: Guild,
    textChannel: TextChannel & { guild: Guild },
    guildData: GuildData,
    guildSettings: GuildSettings
}

export interface DispatcherCreateOptions {
    guild: Guild,
    textChannel: TextChannel & { guild: Guild },
    voiceChannelID: ID,
    filterOptions?: ShoukakuGroupedFilterOptions,
    loopState?: QueueLoopState,
    deaf?: boolean,
    guildData: GuildData,
    guildSettings: GuildSettings
}

export interface ExtendedShoukakuPlayer extends ShoukakuPlayer {
    dispatcher: Dispatcher,
    events: Events
}

export default Dispatcher;

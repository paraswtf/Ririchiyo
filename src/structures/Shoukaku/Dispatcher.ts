import { Collection, Guild, GuildMember, TextChannel } from "discord.js";
import { join } from "path";
import { ShoukakuGroupedFilterOptions, ShoukakuPlayer, ShoukakuPlayOptions, ShoukakuTrackList } from "shoukaku";
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
import { ResourcePart } from "../YouTube";
import { encode } from "@lavalink/encoding";
import { player_inactivity_timeout } from "../../config";
import { ResultAlbum, ResultPlaylist, ResultTrack, SpotifyRegex } from "../Spotify";

const URL_REGEX = /^((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)$/;

//Max exception ratelimit
const maxErrorsPer10Seconds = 3;

export class DispatcherManager extends Collection<ID, Dispatcher>{
    readonly client: RirichiyoClient;
    constructor(entries?: readonly ([ID, Dispatcher])[] | null) {
        super(entries);
        this.client = Utils.client;
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

    //Use this to get the video url
    async fetchVideoURL(query: string) {
        const res = await this.client.ytAPI.searchVideos(query, 1, { part: ResourcePart.video, safeSearch: "moderate" }).catch(console.error);
        if (!res || !res[0]?.id) return null;
        return "https://www.youtube.com/watch?v=" + res[0].id;
    }

    async search(input: string, requester: GuildMember) {
        if (URL_REGEX.test(input)) return await this.searchUrl(input, requester);
        else return this.searchQuery(input, requester);
    }

    async searchQuery(query: string, requester: GuildMember, returnSearchList = false) {
        const videoURL = await this.fetchVideoURL(query);
        if (!videoURL) return null;

        const res = await this.client.shoukaku.getNode().rest.resolve(videoURL).catch(this.client.logger.error);
        if (!res) return null;

        return convertShoukakuTrackListToSearchRes(res, requester, returnSearchList = false);
    }

    async searchUrl(url: string, requester: GuildMember, returnSearchList = false): Promise<SearchRes | null> {
        //If youtube url
        if (/(youtu)(be\.com|\.be)/i.test(url)) {
            const res = await this.client.shoukaku.getNode().rest.resolve(url).catch(this.client.logger.error);
            if (!res) return null;
            return convertShoukakuTrackListToSearchRes(res, requester, returnSearchList);
        }
        else if (SpotifyRegex.test(url)) {
            return await this.client.spotifyApi.getRes(url, requester);
        }
        else return null;
    }
}

function convertShoukakuTrackListToSearchRes(res: ShoukakuTrackList, requester: GuildMember, returnSearchList = false) {
    switch (res.type) {
        case "SEARCH":
            return Object.assign({}, res, { tracks: returnSearchList ? res.tracks.map(t => new RirichiyoTrack(t, requester) as ResolvedTrack) : [new RirichiyoTrack(res.tracks[0], requester) as ResolvedTrack] });

        case "TRACK":
            return Object.assign({}, res, { tracks: [new RirichiyoTrack(res.tracks[0], requester) as ResolvedTrack] });

        case "PLAYLIST":
            return Object.assign({}, res, { tracks: res.tracks.map(t => new RirichiyoTrack(t, requester) as ResolvedTrack) });

        default:
            return Object.assign({}, res, { tracks: res.tracks?.map(t => new RirichiyoTrack(t, requester) as ResolvedTrack) ?? [] });
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
    //Handle errors
    private readonly errors: Collection<PlayerExceptionEvent['exception']['severity'], number> = new Collection();
    //The inactivity checker for the dispatcher
    readonly inactivityChecker: InactivityChecker;

    constructor(options: DispatcherOptions, firstCtx?: GuildCTX) {
        this.client = Utils.client;
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

    async play(options: ShoukakuPlayOptions = { noReplace: false }) {
        if (!this.queue.current) return;
        const track = this.queue.current.isResolved ? this.queue.current : await this.queue.current.resolve()
        return await this.player.playTrack(track.base64, Object.assign(options));
    }

    async sendMessage(options: Parameters<this['textChannel']['send']>['0']) {
        const res = await PermissionUtils.handlePermissionsForChannel(this.textChannel, {
            userToDM: this.guild.ownerId,
            channelToSendMessage: this.textChannel
        });

        if (!res.hasAll) return;

        return await this.textChannel.send(options).catch(this.client.logger.error);
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
    readonly dispatcher: Dispatcher;
    // Class props //

    constructor(dispatcher: Dispatcher) {
        this.dispatcher = dispatcher;
        this.run();
    }

    private run() {
        if (!this._stop && !(this.dispatcher.guildSettings.music.stayConnected && this.dispatcher.guildData.premium.isValid)) {
            //If there is no current track or the player is paused
            if (!this.dispatcher.queue.current || this.dispatcher.player.paused ||
                //If the dispatcher voice channel id does not exist then true
                !this.dispatcher.guild.me?.voice.channel
                ? true
                //Else if channel members are less than 1
                : this.dispatcher.guild.me.voice.channel.members.filter(m => !m.user.bot).size < 1
            ) this.times > 1 ? this.dispatcher.player.emit("playerInactivity") : ++this.times;
        }
        else this.times = 0;
        if (!this._stop) setTimeout(this.run.bind(this), player_inactivity_timeout);
    }

    public stop() {
        this._stop = true;
    }
}

export type SearchRes = Omit<ShoukakuTrackList, 'tracks'> & {
    tracks: ResolvedTrack[]
}
    | ResultTrack
    | ResultPlaylist
    | ResultAlbum

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

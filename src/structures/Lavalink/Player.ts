import {
    Guild,
    TextChannel,
    VoiceChannel
} from "discord.js";
import {
    Manager,
    SearchQuery,
    VoiceEvent
} from "./LavalinkClient";
import Queue from "./Queue";
import Node from './Node';
import { GuildMember } from "discord.js";
import { ResolvedTrack } from "./Track";

export class Player {
    /** The Queue for the Player. */
    public readonly queue = new Queue();
    /** Whether the queue repeats the track. */
    public trackRepeat = false;
    /** Whether the queue repeats the queue. */
    public queueRepeat = false;
    /** If the player should autoplay the next track */
    public autoPlay = true;
    /** The loop state of the player */
    private _loopState: LoopState = "DISABLED";
    /** The current track */
    public current: ResolvedTrack | null = null;
    public get loopState() {
        return this._loopState;
    }
    public set loopState(value: LoopState) {
        switch (value) {
            case 'QUEUE':
                this.trackRepeat = !(this.queueRepeat = true);
                break;
            case 'TRACK':
                this.queueRepeat = !(this.trackRepeat = true);
                break;
            default:
                this.queueRepeat = this.trackRepeat = false;
                break;
        }
    }
    /** The time the player is in the track. */
    public position = 0;
    /** Whether the player is playing. */
    public playing = false;
    /** Whether the player is paused. */
    public paused = false;
    /** Whether the player is playing. */
    public volume: number;
    /** The Node for the Player. */
    public node: Node;
    /** The guild the player. */
    public guild: Guild;
    /** The voice channel for the player. */
    public voiceChannel: VoiceChannel | null = null;
    /** The text channel for the player. */
    public textChannel: TextChannel;
    /** The current state of the player. */
    public state: PlayerState = "DISCONNECTED";
    /** The equalizer bands array. */
    public bands = new Array<number>(15).fill(0.0);
    /** The player audio filters */
    public filters: Filters = {};
    /** The voice state object from Discord. */
    public voiceState: VoiceState = Object.assign({});
    /** The Manager. */
    public manager: Manager;
    /** InactivityChecker for the player */
    inactivityChecker: InactivityChecker;
    /** Player options */
    readonly options: Required<PlayerOptions>;

    constructor(manager: Manager, options: PlayerOptions) {
        this.manager = manager;
        this.options = Object.assign({ volume: 100, selfMute: false, selfDeafen: true, serverDeaf: true, autoPlay: true, stayConnected: false, voiceChannel: null }, options) as Required<PlayerOptions>
        this.inactivityChecker = new InactivityChecker(this, this.options.stayConnected);
        this.guild = this.options.guild;
        this.textChannel = this.options.textChannel;
        this.voiceChannel = this.options.voiceChannel;
        this.volume = this.options.volume;
        const node = this.options.node && this.manager.nodes.has(this.options.node) ? this.manager.nodes.get(this.options.node) : this.manager.leastLoadNodes.first();
        if (!node) throw new RangeError("No available nodes.");
        this.node = node;
        this.manager.players.set(this.guild.id!, this);
        this.manager.emit("playerCreate", this);
    }

    /**
     * Same as Manager#search() but a shortcut on the player itself.
     * @param query
     * @param requester
     */
    search(query: string | SearchQuery, requester: GuildMember) {
        return this.manager.search(query, requester);
    }

    /**
    * Sets the players equalizer band on-top of the existing ones.
    * @param bands
    */
    public setEQ(...bands: EqualizerBand[]): this {
        // Hacky support for providing an array
        if (Array.isArray(bands[0])) bands = bands[0] as unknown as EqualizerBand[]

        if (!bands.length || !bands.every((band) => JSON.stringify(Object.keys(band).sort()) === '["band","gain"]'))
            throw new TypeError("Bands must be a non-empty object array containing 'band' and 'gain' properties.");

        for (const { band, gain } of bands) this.bands[band] = gain;

        this.filters.equalizer = this.bands.map((gain, band) => ({ band, gain }));

        this.node.send({
            op: "filters",
            guildId: this.guild.id,
            ...this.filters
        });

        return this;
    }

    /** Clears the equalizer bands. */
    public clearEQ(): this {
        delete this.filters.equalizer;

        this.node.send({
            op: "filters",
            guildId: this.guild.id,
            ...this.filters
        });

        return this;
    }

    /** Connect to the voice channel. */
    public connect(channel: VoiceChannel | null = null): this {
        if (channel) this.voiceChannel = channel;

        if (!this.voiceChannel) throw new RangeError("No voice channel has been set.");

        this.state = "CONNECTING";

        /**
         * Server deafen if has permissions and option enabled in player
         */
        if (this.options.serverDeaf && this.voiceChannel.permissionsFor(this.manager.options.client.user!)?.has("DEAFEN_MEMBERS")) {
            if (this.guild.me?.voice.channel) this.guild.me.voice.setDeaf(true).catch(err => this.manager.logger.error(err.message || err));
        }

        this.manager.client.guilds.resolve(this.guild.id)?.shard.send({
            op: 4,
            d: {
                guild_id: this.guild.id,
                channel_id: this.voiceChannel.id,
                self_mute: this.options.selfMute || false,
                self_deaf: this.options.selfDeafen || false,
            },
        });

        this.state = "CONNECTED";
        return this;
    }

    /** Disconnect from the voice channel. */
    public disconnect(): this {
        if (this.voiceChannel === null) return this;
        this.inactivityChecker.stop();
        this.state = "DISCONNECTING";

        this.pause(true);
        this.manager.client.guilds.resolve(this.guild.id)?.shard.send({
            op: 4,
            d: {
                guild_id: this.guild.id,
                channel_id: null,
                self_mute: false,
                self_deaf: false,
            },
        });

        this.voiceChannel = null;
        this.state = "DISCONNECTED";
        return this;
    }

    /** Destroys the player. */
    public destroy(): void {
        this.state = "DESTROYING";
        this.inactivityChecker.stop();
        this.disconnect();

        this.node.send({
            op: "destroy",
            guildId: this.guild.id,
        });

        this.manager.emit("playerDestroy", this);
        this.manager.players.delete(this.guild.id);
    }

    /**
     * Sets the player voice channel.
     * @param channel
     */
    public setVoiceChannel(channel: VoiceChannel): this {
        if (!(channel instanceof VoiceChannel)) throw new TypeError('Channel must be a discord "VoiceChannel".');

        this.voiceChannel = channel;
        this.connect();
        return this;
    }

    /**
     * Sets the player text channel.
     * @param channel
     */
    public setTextChannel(channel: TextChannel): this {
        if (!(channel instanceof TextChannel)) throw new TypeError('Channel must be a discord "TextChannel".');

        this.textChannel = channel;
        return this;
    }

    /**
     * Plays the next track.
     * @param options
     */
    public async play(options: PlayOptions = {}): Promise<void> {
        if (!this.queue.current) throw new RangeError("No current track.");


        if (!this.queue.current.isResolved) {
            try {
                await this.queue.current.resolve();
            } catch (error) {
                const payload: TrackEndEvent = { op: 'event', type: "TrackEndEvent", reason: "LOAD_FAILED", guildId: this.guild.id };
                const removedTrack = this.queue.remove(this.queue.currentIndex)[0];

                if (!this.queue.current) {
                    if (this.queue.length && this.queueRepeat) this.queue.currentIndex = 0;
                    else {
                        this.playing = false;
                        this.manager.emit("queueEnd", this, removedTrack, payload);
                        return;
                    }
                }

                this.manager.emit("trackEnd", this, removedTrack, payload);
                if (this.autoPlay) this.play();
                return;
            }
        }

        this.current = this.queue.current as ResolvedTrack;

        const payload = {
            op: "play",
            guildId: this.guild.id,
            track: this.current.base64,
            ...options,
        };

        await this.node.send(payload);
    }

    /**
     * Sets the player volume.
     * @param volume
     */
    public setVolume(volume: number): this {
        this.volume = Math.max(Math.min(volume, 1000), 0);

        this.node.send({
            op: "volume",
            guildId: this.guild.id,
            volume: this.volume,
        });

        return this;
    }

    /**
     * Sets the track repeat.
     * @param repeat
     */
    public setTrackRepeat(repeat: boolean): this {
        if (typeof repeat !== "boolean") throw new TypeError('Repeat can only be "true" or "false".');

        this.loopState = repeat ? 'TRACK' : 'DISABLED';

        return this;
    }

    /**
     * Sets the queue repeat.
     * @param repeat
     */
    public setQueueRepeat(repeat: boolean): this {
        if (typeof repeat !== "boolean") throw new TypeError('Repeat can only be "true" or "false".');

        this.loopState = repeat ? 'QUEUE' : 'DISABLED';

        return this;
    }

    /** Skips the current track, optionally give an amount to skip to, e.g 5 would play the 5th song. */
    public skip(amount?: number): this {
        if (typeof amount === "number" && amount > 1) {
            if (this.queue.currentIndex + amount >= this.queue.length) throw new RangeError("Cannot skip more than the queue length.");

            this.queue.currentIndex += amount;
        }

        this.node.send({
            op: "stop",
            guildId: this.guild.id,
        });

        return this;
    }

    /** Go back an amount of tracks. */
    backTo(amount = 1) {
        if (amount < 1) throw new RangeError(`Amount cannot be less than 1`);
        if (amount < this.queue.currentIndex) throw new RangeError(`Amount cannot be more than trackHistory length`);

        this.queue.currentIndex -= amount;

        !(this.playing && this.queue.current) ? this.play() : this.skip();
        return this;
    }

    /** Stops the player and clears the queue. */
    public stop() {
        this.queue.clear();
        return this.skip();
    }

    /**
     * Pauses the current track.
     * @param pause
     */
    public pause(pause: boolean): this {
        if (typeof pause !== "boolean") throw new RangeError('Pause can only be "true" or "false".');

        // If already paused or the queue is empty do nothing
        if (this.paused === pause || !this.queue.current) return this;

        this.playing = !pause;
        this.paused = pause;

        console.log(pause);
        this.node.send({
            op: "pause",
            guildId: this.guild.id,
            pause,
        });

        return this;
    }

    /**
     * Seeks to the position in the current track.
     * @param position
     */
    public seek(position: number): this {
        if (!this.queue.current || !this.queue.current.isSeekable) return this;

        if (position < 0 || position > this.queue.current.duration) position = Math.max(Math.min(position, this.queue.current.duration), 0);

        this.position = position;
        this.node.send({
            op: "seek",
            guildId: this.guild.id,
            position,
        });

        return this;
    }

    /**
     * Sets the timescale filter.
     * @param {Filters["timescale"]} options Timescale options
     */
    setTimescale({ speed, pitch, rate }: Filters["timescale"] = {}) {
        if (!speed && !pitch && !rate) delete this.filters.timescale;
        else this.filters.timescale = {
            "speed": speed || 1,
            "pitch": pitch || 1,
            "rate": rate || 1
        };

        this.node.send({
            op: "filters",
            guildId: this.guild.id,
            ...this.filters
        });
    }

    /**
     * Sets the tremolo filter.
     * @param {Filters["tremolo"]} options Tremolo options
     */
    setTremolo({ frequency, depth }: Filters["tremolo"] = {}) {
        if (!depth || !frequency) delete this.filters.tremolo;
        else {
            if (depth > 1 || depth < 0) throw new RangeError("The depth must be between 0 and 1");
            if (frequency > 0) throw new RangeError("The frequency must be grater than 0");
            this.filters.tremolo = {
                "frequency": frequency,
                "depth": depth
            };
        }

        this.node.send({
            op: "filters",
            guildId: this.guild.id,
            ...this.filters
        });
    }

    /**
     * Sets the rotation filter.
     * @param {Filters["rotation"]} options Rotation options
     */
    setRotation({ rotationHz }: Filters["rotation"] = {}) {
        if (!rotationHz) delete this.filters.rotation;
        else {
            if (rotationHz < 0) throw new RangeError("The rotationHz must be grater than 0");
            this.filters.rotation = {
                "rotationHz": rotationHz || 0
            };
        }

        this.node.send({
            op: "filters",
            guildId: this.guild.id,
            ...this.filters
        });
    }

    /** Reset or set all audio filters */
    setFilters(filters: Filters = {}) {
        this.filters = filters;
        this.node.send({
            op: "filters",
            guildId: this.guild.id,
            ...this.filters
        });
    }
}

export class InactivityChecker {
    // Class props //
    private _stop: boolean = false;
    times = 0;
    player: Player;
    condition: () => boolean
    // Class props //

    constructor(player: Player, condition: boolean | (() => boolean)) {
        this.player = player;
        this.run();
        this.condition = typeof condition === 'function' ? condition : () => condition
    }

    private run() {
        if (!this._stop) {
            if (!this.player.playing || (this.player.voiceChannel?.members.filter(m => !m.user.bot).size || 0) < 1)
                if (this.times > 1) this.player.manager.emit("playerInactivity", this.player);
                else ++this.times;
        }
        else this.times = 0;
        if (!this._stop) setTimeout(() => this.run(), this.player.manager.options.playerInactivityTimeout);
    }

    public stop() {
        this._stop = true;
    }
}

export interface PlayerOptions {
    /** The guild the Player belongs to. */
    guild: Guild;
    /** The text channel the Player belongs to. */
    textChannel: TextChannel;
    /** The voice channel the Player belongs to. */
    voiceChannel?: VoiceChannel | null;
    /** The node the Player uses. */
    node?: string;
    /** The initial volume the Player will use. */
    volume?: number;
    /** If the player should mute itself. */
    selfMute?: boolean;
    /** If the player should deaf itself. */
    selfDeafen?: boolean;
    /** If the player should server deaf itself. */
    serverDeaf?: boolean;
    /** If the player should autoplay the next track */
    autoPlay?: boolean;
    /** Wether the player should stay connected */
    stayConnected?: (() => boolean) | boolean;
}

export interface VoiceState {
    op: "voiceUpdate";
    guildId: string;
    event: VoiceEvent;
    sessionId?: string;
}

export type LoopState = "TRACK" | "QUEUE" | "DISABLED";
export type PlayerState =
    | "CONNECTED"
    | "CONNECTING"
    | "DISCONNECTED"
    | "DISCONNECTING"
    | "DESTROYING";

export interface Filters {
    timescale?: {
        speed?: number,
        pitch?: number,
        rate?: number
    },
    tremolo?: {
        frequency?: number,
        depth?: number
    },
    rotation?: {
        rotationHz?: number
    },
    equalizer?: EqualizerBand[]
}

export interface EqualizerBand {
    /** The band number being 0 to 14. */
    band: number;
    /** The gain amount being -0.25 to 1.00, 0.25 being double. */
    gain: number;
}

export interface PlayOptions {
    /** The position to start the track. */
    readonly startTime?: number;
    /** The position to end the track. */
    readonly endTime?: number;
    /** Whether to not replace the track if a play payload is sent. */
    readonly noReplace?: boolean;
}

export interface Exception {
    severity: Severity;
    message: string;
    cause: string;
}

export type Severity = "COMMON" | "SUSPICIOUS" | "FAULT";

export type PlayerEvents =
    | TrackStartEvent
    | TrackEndEvent
    | TrackStuckEvent
    | TrackExceptionEvent
    | WebSocketClosedEvent;

export type PlayerEventType =
    | "TrackStartEvent"
    | "TrackEndEvent"
    | "TrackExceptionEvent"
    | "TrackStuckEvent"
    | "WebSocketClosedEvent";

export interface PlayerEvent {
    op: "event";
    type: PlayerEventType;
    guildId: string;
}

export interface TrackStartEvent extends PlayerEvent {
    type: "TrackStartEvent";
    track: string;
}

export interface TrackEndEvent extends PlayerEvent {
    type: "TrackEndEvent";
    track?: string;
    reason: TrackEndReason;
}

export type TrackEndReason =
    | "FINISHED"
    | "LOAD_FAILED"
    | "STOPPED"
    | "REPLACED"
    | "CLEANUP";

export interface TrackExceptionEvent extends PlayerEvent {
    type: "TrackExceptionEvent";
    exception?: Exception;
    error: string;
}

export interface TrackStuckEvent extends PlayerEvent {
    type: "TrackStuckEvent";
    thresholdMs: number;
}

export interface WebSocketClosedEvent extends PlayerEvent {
    type: "WebSocketClosedEvent";
    code: number;
    byRemote: boolean;
    reason: string;
}

export interface PlayerUpdate {
    op: "playerUpdate";
    state: {
        position: number;
        time: number;
    };
    guildId: string;
}

export default Player;

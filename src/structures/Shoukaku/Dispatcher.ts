import { Guild, StageChannel, TextChannel, VoiceChannel } from "discord.js";
import { ShoukakuFilter, ShoukakuGroupedFilterOptions, ShoukakuJoinOptions, ShoukakuPlayOptions, ShoukakuSocket, ShoukakuTrack } from "shoukaku";
import Utils, { CustomError } from "../Utils";
import { RirichiyoFilter } from "./RirichiyoFilter";

export class Dispatcher {
    readonly guild: Guild;
    voiceChannel: DispatcherVoiceChannel;
    textChannel?: DispatcherTextChannel;
    loopState: DispatcherLoopState;
    filters: ShoukakuGroupedFilterOptions;

    get player() {
        return Utils.client.shoukaku.players.get(this.guild.id);
    }

    constructor(guild: Guild, options: DispatcherOptions) {
        Utils.client.dispatchers.set(guild.id, this);
        this.guild = guild;
        this.voiceChannel = options.voiceChannel;
        this.textChannel = options.textChannel;
        this.filters = options.filters ?? {};
        this.loopState = options.loopState ?? "DISABLED";
    }

    async connect(options: DispatcherConnectOptions = {}) {
        if (!this.player) await Utils.client.shoukaku.getNode()
            .joinVoiceChannel(Object.assign({
                guildID: this.guild.id,
                voiceChannelID: this.voiceChannel.id,
                mute: false,
                deaf: true
            }, options)).then(p => p.setGroupedFilters(this.filters)).catch(e => {
                throw new CustomError(e)
            });
        else this.player.voiceConnection.attemptReconnect({ voiceChannelID: this.voiceChannel.id });
        return this;
    }

    destroy() {
        Utils.client.dispatchers.delete(this.guild.id);
        this.player?.disconnect();
        return this;
    }

    async playTrack(track: string | ShoukakuTrack, options?: ShoukakuPlayOptions) {
        if (!this.player) return new CustomError("The player does not exist for some reason... You sure bruh?");
        return await this.player.playTrack(track, options);
    }
}

export interface DispatcherOptions {
    voiceChannel: DispatcherVoiceChannel,
    textChannel?: DispatcherTextChannel,
    filters?: ShoukakuGroupedFilterOptions,
    loopState?: DispatcherLoopState
}

export interface DispatcherConnectOptions {
    deaf?: boolean
}

export type DispatcherVoiceChannel = (VoiceChannel | StageChannel) & { guild: Guild };
export type DispatcherTextChannel = TextChannel & { guild: Guild };

export type DispatcherLoopState = "DISABLED" | "QUEUE" | "TRACK";

export default Dispatcher;

import { Guild, StageChannel, TextChannel, VoiceChannel } from "discord.js";
import { ShoukakuJoinOptions, ShoukakuPlayOptions, ShoukakuSocket, ShoukakuTrack } from "shoukaku";
import Utils, { CustomError } from "../Utils";

export class Dispatcher {
    guild: Guild;
    voiceChannel: DispatcherVoiceChannel;
    textChannel?: DispatcherTextChannel;

    get player() {
        return Utils.client.shoukaku.players.get(this.guild.id);
    }

    constructor(guild: Guild, voiceChannel: DispatcherVoiceChannel, textChannel?: DispatcherTextChannel) {
        Utils.client.dispatchers.set(guild.id, this);
        this.guild = guild;
        this.voiceChannel = voiceChannel;
        this.textChannel = textChannel;
    }

    async connect(options: DispatcherConnectOptions) {
        await Utils.client.shoukaku.getNode()
            .joinVoiceChannel(Object.assign({
                guildID: this.guild.id,
                voiceChannelID: this.voiceChannel.id,
                mute: false,
                deaf: true
            }, options));
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

export interface DispatcherConnectOptions {
    deaf: boolean
}

export type DispatcherVoiceChannel = (VoiceChannel | StageChannel) & { guild: Guild };
export type DispatcherTextChannel = TextChannel & { guild: Guild };

export default Dispatcher;

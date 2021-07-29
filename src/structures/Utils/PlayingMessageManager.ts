import { Collection } from 'discord.js';
import { Dispatcher } from '../Shoukaku/Dispatcher';
import { ResolvedTrack } from '../Shoukaku/RirichiyoTrack';
import PlayingMessage from './PlayingMessage';

export default class PlayingMessageManager extends Collection<string, PlayingMessage> {
    readonly dispatcher!: Dispatcher;

    constructor(entries?: readonly ([string, PlayingMessage])[] | null, dispatcher?: Dispatcher) {
        super();
        if (dispatcher) this.dispatcher = dispatcher;
    }

    createMessage(track: ResolvedTrack): PlayingMessage {
        const playingMessage = new PlayingMessage(this, track);
        this.set(track.id, playingMessage);
        return playingMessage;
    }

    deleteMessage(id: string) {
        const playingMessage = this.get(id);
        if (!playingMessage) return;
        playingMessage.delete();
        this.delete(id);
    }
}

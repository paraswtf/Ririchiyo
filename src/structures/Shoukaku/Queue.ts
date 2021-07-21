import {
    AnyTrack,
    validateTrackOrTrackArray
} from "./RirichiyoTrack";

export class Queue extends Array<AnyTrack> {
    /** The approximate duration of the queue. */
    public get duration(): number {
        return this.reduce((acc: number, t: AnyTrack) => acc + t.displayDuration, this.current?.displayDuration ?? 0);
    }

    /** The current track */
    public get current(): AnyTrack | undefined {
        return this[this.currentIndex];
    }

    /** The previous tracks */
    public get previousTracks() {
        return this.slice(0, this.currentIndex)
    }

    /** The upcoming tracks */
    public get upcomingTracks() {
        return this.slice(this.currentIndex + 1);
    }

    /** The index of the current track */
    public currentIndex: number = 0;


    /** Adds a track to the end of queue */
    public add(track: AnyTrack | AnyTrack[], index?: number): void {
        if (typeof index === 'number' && index <= this.currentIndex) throw new RangeError('Track cannot be inserted before or at the "currentIndex"');
        if (!validateTrackOrTrackArray(track)) throw new RangeError('Track must be a "Track" or "Track[]".');

        if (Array.isArray(track)) {
            if (typeof index === 'number') this.splice(index, 0, ...track);
            else this.push(...track);
        }
        else {
            if (typeof index === 'number') this.splice(index, 0, track);
            else this.push(track);
        }
    }

    /** Removes an amount of tracks using a inclusive start and inclusive end index, returning the removed tracks, EXCLUDING THE `current` TRACK. */
    public remove(startOrPosition = this.currentIndex + 1, end?: number): AnyTrack[] {
        if (startOrPosition < this.currentIndex) throw new RangeError(`The "start" cannot be less than ${this.currentIndex}.`);
        if (end) {
            if (startOrPosition >= end) throw new RangeError("Start can not be bigger than end.");
            if (startOrPosition >= this.length) throw new RangeError(`Start can not be bigger than ${this.length}.`);

            return this.splice(startOrPosition, (end - startOrPosition) + 1);
        }
        return this.splice(startOrPosition, 1);
    }

    /** Clears the queue. */
    public clear(): void {
        this.splice(0);
    }

    /** Shuffles the queue. */
    public shuffle(): void {
        if (this.upcomingTracks.length >= 2) this.splice(
            this.currentIndex + 1,
            this.length - (this.currentIndex + 1),
            ...randomizeArray(this.upcomingTracks)
        );
    }
}

function randomizeArray<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export default Queue;

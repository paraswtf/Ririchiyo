import {
    AnyTrack,
    validateTrackOrTrackArray
} from "./RirichiyoTrack";
import Search from 'fuse.js';

const searchOptions: Search.IFuseOptions<AnyTrack> = {
    isCaseSensitive: false,
    keys: [
        { name: 'displayTitle', weight: 3 },
        { name: "displayURL", weight: 2 },
        { name: "displayArtist", weight: 2 }
    ],
    threshold: 0.4
}

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

    /** Array of YouTube recommendations */
    public recommendations: AnyTrack[] = [];

    /** The index of the current track */
    public readonly currentIndex: number = 0;

    setCurrentIndex(index: number) {
        if (!this.length) return;
        //@ts-ignore
        this.currentIndex = Math.min(this.length - 1, Math.max(0, Number.parseInt(index.toString())));
    }

    /** The loop state of the queue */
    public readonly loopState: QueueLoopState = "DISABLED";

    /** Handle incrementing to the next track */
    next(force = false) {
        switch (force ? "DISABLED" : this.loopState) {
            /** In case of force = true, this will be used */
            //This runs for "DISABLED" as well as force = true
            default: {
                //If the length of queue is greater than the currently set index, increment the current index, so at most the currentIndex can be 1 higher than the amount of tracks
                if (this.length > this.currentIndex)
                    //@ts-expect-error Increment the current index, readonly as to not let it change from outside without errors
                    ++this.currentIndex
                break;
            }


            /** Below cases will run only when force = false */

            case "QUEUE": {
                //If the length of queue is greater than the currently set index+1 (so that the queue goes to the first track in queue loop if there's no next track)
                if (this.length > this.currentIndex + 1)
                    //@ts-expect-error Increment the current index, readonly as to not let it change from outside without errors
                    ++this.currentIndex
                //@ts-expect-error Change the current index to 0 if the queue has ended and next, readonly as to not let it change from outside without errors
                else this.currentIndex = 0;
                break;
            }

            case "TRACK": {
                //Do nothing in case of track loop
                break;
            }
        }
    }

    /** Set the queue loop state */
    setLoopState(loopState: QueueLoopState) {
        switch (loopState) {
            case "QUEUE":
                //@ts-expect-error The loopState is readonly as to not let it change from outside without errors
                this.loopState = "QUEUE";
                break;

            case "TRACK":
                //@ts-expect-error The loopState is readonly as to not let it change from outside without errors
                this.loopState = "TRACK";
                break;

            default:
                //@ts-expect-error The loopState is readonly as to not let it change from outside without errors
                this.loopState = "DISABLED";
                break
        }
        return this.loopState;
    }

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
        if (startOrPosition === this.currentIndex ||
            startOrPosition >= this.length ||
            (end &&
                (
                    end >= this.length ||
                    end === this.currentIndex ||
                    startOrPosition >= end ||
                    (startOrPosition < this.currentIndex && end > this.currentIndex)
                )
            )
        ) throw new RangeError(`Invalid range.`);
        //If tracks before the current index were removed
        if (startOrPosition < this.currentIndex) this.setCurrentIndex(end ? this.currentIndex - ((end - startOrPosition) + 1) : this.currentIndex - 1);

        if (end) return this.splice(startOrPosition, (end - startOrPosition) + 1);
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

    /** Fuzzy search queue tracks */
    public findByQuery(query: string): number {
        if (!this.length) return -1;
        const searchResult = new Search(this, searchOptions).search(query);
        if (!searchResult[0]) return -1;
        return searchResult[0].refIndex;
    }
}

function randomizeArray<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export type QueueLoopState = "DISABLED" | "QUEUE" | "TRACK";

export default Queue;

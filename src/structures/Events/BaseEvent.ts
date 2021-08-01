import { EventEmitter } from 'events';
import RirichiyoClient from '../RirichiyoClient';

export class BaseEvent<T extends EventEmitter = RirichiyoClient> {
    name: string;
    category: string;
    public readonly emitter!: T;
    public readonly filePath!: string;

    constructor(options: EventProps) {
        const { name, category } = check(options);
        this.name = name;
        this.category = category;
    }

    init(emitter: T, filePath: string): any { Object.assign(this, { emitter, filePath }) };
    async run(emitter?: T, ...args: any[]): Promise<any> { };
}

export interface EventProps {
    name: string;
    category: string;
}

function check(options?: EventProps): EventProps {
    if (!options) throw new TypeError("No options provided for event.");

    if (!options.name) throw new TypeError("No name provided for event.");
    if (typeof options.name !== 'string') throw new TypeError("Event option 'name' must be of type 'string'.");

    if (!options.category) throw new TypeError("No category provided for event.");
    if (typeof options.category !== 'string') throw new TypeError("Event option 'category' must be of type 'string'.");

    return options;
}

export default BaseEvent;

import { Collection } from 'discord.js';
import BaseEvent from './BaseEvent';
import { EventEmitter } from 'events';
import merge from 'deepmerge';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import RirichiyoClient from '../RirichiyoClient';
import { Logger } from '../Utils';

export interface EventLoadOpts {
    exclude?: {
        events?: string[],
        categories?: string[]
    }
}

export class Events<T extends EventEmitter & { logger?: Logger } = RirichiyoClient> extends Collection<string, BaseEvent<T>> {
    /** The bot client */
    readonly emitter!: T;
    readonly logger?: Logger;
    options: EventLoadOpts = { exclude: { events: [], categories: [] } };
    //Class Props//

    constructor(entries?: readonly ([string, BaseEvent<T>])[] | null, emitter?: T, logger?: Logger) {
        super(entries);
        if (emitter) {
            this.emitter = emitter;
            this.logger = emitter.logger || logger
        }
    }

    load(dir: string = "", options?: EventLoadOpts) {
        if (options) {
            this.options = merge(this.options, options);
        }

        const filePath = path.join(path.resolve(".", dir)); //The path for the command folder
        const directory = fs.readdirSync(filePath, { withFileTypes: true }) //This may be a file or a folder

        for (const index in directory) {
            const file = directory[index];
            if (file.isDirectory()) this.load(path.join(dir, file.name)); //If it is a folder then load events inside it
            if (file.name.endsWith('.js')) {
                this.loadEvent(path.join(filePath, file.name));
            }
        }

        return this;
    }

    loadEvent(filePath: string) {
        const { default: Event } = require(filePath);
        if (Event && Event.prototype instanceof BaseEvent) {

            const evt = new Event() as BaseEvent<T>;
            if (this.options.exclude && this.options.exclude.events && this.options.exclude.events.includes(evt.name) || this.options.exclude && this.options.exclude.categories && this.options.exclude.categories.includes(evt.category)) return;
            evt.init(this.emitter, filePath);

            let isReload = false;
            if (this.has(evt.name)) {
                this.emitter.removeListener(evt.name, this.get(evt.name)!.run);
                isReload = true
            };

            this.set(evt.name, evt);
            this.emitter.on(evt.name, evt.run.bind(evt, this.emitter));

            if (this.logger) this.logger.debug(`${isReload ? "Rel" : "L"}oaded event from ${chalk.underline(filePath)} -> [${evt.category}|${evt.name}]`);
            else console.debug(`${isReload ? "Rel" : "L"}oaded event from ${chalk.underline(filePath)} -> [${evt.category}|${evt.name}]`);
        }

        return this;
    }

    unloadEvent(name: string) {
        if (!this.has(name)) return;

        const evt = this.get(name)!;

        this.emitter.removeListener(evt.name, evt.run)

        this.delete(evt.name);

        if (this.logger) this.logger.debug(`Unoaded event from ${chalk.underline(evt.filePath)} -> [${evt.category}|${evt.name}]`);
        else console.debug(`Unoaded event from ${chalk.underline(evt.filePath)} -> [${evt.category}|${evt.name}]`);
    }

    removeAllListeners() {
        this.emitter.removeAllListeners();
    }
}

export default Events;

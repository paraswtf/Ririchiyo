import { Collection } from 'discord.js';
import BaseCommand from './BaseCommand';
import Client from '../Client';
import merge from 'deepmerge';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';


export interface CommandLoadOpts {
    exclude?: {
        commands?: string[],
        categories?: string[]
    }
}

export class Commands extends Collection<string, BaseCommand>{
    /** The bot client */
    client!: Client;
    options: CommandLoadOpts = { exclude: { commands: [], categories: [] } };
    //Class Props//

    constructor(entries?: readonly ([string, BaseCommand])[] | null, client?: Client) {
        super(entries);
        if (client) this.client = client;
    }

    load(dir: string = "", options?: CommandLoadOpts) {
        if (options) {
            this.options = merge(this.options, options);
        }

        const filePath = path.join(path.resolve(".", dir)); //The path for the command folder
        const directory = fs.readdirSync(filePath, { withFileTypes: true }) //This may be a file or a folder

        for (const index in directory) {
            const file = directory[index];
            if (file.isDirectory()) this.load(path.join(dir, file.name)); //If it is a folder then load commands inside it
            if (file.name.endsWith('.js')) {
                this.loadCommand(path.join(filePath, file.name));
            }
        }

        return this;
    }

    loadCommand(filePath: string) {
        const { default: Command } = require(filePath);
        if (Command && Command.prototype instanceof BaseCommand) {

            const cmd = new Command() as BaseCommand;
            if (this.options.exclude && this.options.exclude.commands && this.options.exclude.commands.includes(cmd.name) || this.options.exclude && this.options.exclude.categories && this.options.exclude.categories.includes(cmd.category)) return;
            cmd.init(this.client, filePath); //Initialize The command

            let isReload = false;
            if (this.has(cmd.name)) isReload = true;
            this.set(cmd.name, cmd);
            this.client.logger.log(`${isReload ? "Rel" : "L"}oaded command from ${chalk.underline(filePath)} -> [${cmd.category}|${cmd.name}]`);
        }

        return this;
    }
}

export default Commands;

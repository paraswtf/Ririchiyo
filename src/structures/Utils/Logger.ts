import { isMaster } from 'cluster';
import RirichiyoClient from '../RirichiyoClient';
import chalk from 'chalk';
import CustomError from './CustomError';
import { inspect } from 'util';
import { isProduction, isDevelopment } from '../../config';

export class Logger {
    // Class props //
    client: RirichiyoClient;
    // Class props //

    constructor(client: RirichiyoClient) {
        this.client = client;
    }

    get identifier() {
        return `${chalk.blueBright(`[${isDevelopment ? `${new Date().toLocaleString()} | ` : ''}${isMaster ? "MANAGER" : `CLUSTER-${process.env.CLUSTER_ID}`} | PID-${process.pid}]`)} ${chalk.yellowBright(`=> `)}`;
    }

    debug = debug.bind(this);
    log = log.bind(this);
    info = info.bind(this);
    error = error.bind(this);
    warn = warn.bind(this);
}

function log(this: Logger, message: any) {
    message = parseMessage(message);
    console.log(this.identifier + message);
    return undefined;
}

function debug(this: Logger, message: any) {
    if (isProduction) return;
    message = parseMessage(message);
    console.log(this.identifier + chalk.cyan(message));
    return undefined;
}

function info(this: Logger, message: any) {
    message = parseMessage(message);
    console.log(this.identifier + chalk.cyan(message));
    return undefined;
}

function error(this: Logger, message: any) {
    message = parseMessage(message);
    console.trace("\b\b\b\b\b\b\b" + this.identifier + chalk.redBright(message));
    return undefined;
}

function warn(this: Logger, message: any) {
    message = parseMessage(message);
    console.trace("\b\b\b\b\b\b\b" + this.identifier + chalk.yellowBright(message));
    return undefined;
}

function parseMessage(message: any): string {
    message = (message as Error | CustomError).message ?? message;
    if (typeof message !== 'string') message = inspect(message);
    return message as string;
}

export default Logger;

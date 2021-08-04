import { isMaster } from 'cluster';
import RirichiyoClient from '../RirichiyoClient';
import chalk from 'chalk';
import CustomError from './CustomError';
const isProduction = process.env.NODE_ENV === "production";

export class Logger {
    // Class props //
    client: RirichiyoClient;
    // Class props //

    constructor(client: RirichiyoClient) {
        this.client = client;
    }

    get identifier() {
        return `${chalk.blueBright(`[${isMaster ? "MANAGER" : `CLUSTER-${process.env.CLUSTER_ID}`} | PID-${process.pid}]`)} ${chalk.yellowBright(`=> `)}`;
    }

    debug = debug.bind(this);
    log = log.bind(this);
    info = info.bind(this);
    error = error.bind(this);
    warn = warn.bind(this);
}

function log(this: Logger, message: string | Error | CustomError) {
    console.log(this.identifier + ((message as Error | CustomError).message || message));
    return undefined;
}

function debug(this: Logger, message: string | Error | CustomError) {
    if (isProduction) return;
    console.log(this.identifier + chalk.cyan((message as Error | CustomError).message || message));
    return undefined;
}

function info(this: Logger, message: string | Error | CustomError) {
    console.log(this.identifier + chalk.cyan((message as Error | CustomError).message || message));
    return undefined;
}

function error(this: Logger, message: string | Error | CustomError) {
    console.trace("\b\b\b\b\b\b\b" + this.identifier + chalk.redBright((message as Error | CustomError).message || message));
    return undefined;
}

function warn(this: Logger, message: string | Error | CustomError) {
    console.trace("\b\b\b\b\b\b\b" + this.identifier + chalk.yellowBright((message as Error | CustomError).message || message));
    return undefined;
}

export default Logger;

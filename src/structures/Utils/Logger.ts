import { isMaster } from 'cluster';
import RirichiyoClient from '../RirichiyoClient';
import chalk from 'chalk';
import CustomError from './CustomError';

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

    log(message: string | Error | CustomError) {
        console.log(this.identifier + ((message as Error | CustomError).message || message));
        return undefined;
    }

    info(message: string | Error | CustomError) {
        console.log(this.identifier + chalk.cyan((message as Error | CustomError).message || message));
        return undefined;
    }

    error(message: string | Error | CustomError) {
        console.trace("\b\b\b\b\b\b\b" + this.identifier + chalk.redBright((message as Error | CustomError).message || message));
        return undefined;
    }

    warn(message: string | Error | CustomError) {
        console.trace("\b\b\b\b\b\b\b" + this.identifier + chalk.yellowBright((message as Error | CustomError).message || message));
        return undefined;
    }
}

export default Logger;

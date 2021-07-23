export class CustomError {
    message: string;
    constructor(message: string | Error | unknown) {
        this.message = (message as Error).message as string ?? message as string;
    }
}

export default CustomError;

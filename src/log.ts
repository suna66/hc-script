export default class Logger {
    static loggerLevel: number = 0;

    static log(...message: any[]) {
        if (Logger.loggerLevel > 1) {
            return;
        }
        console.log(...message);
    }

    static info(...message: any[]) {
        if (Logger.loggerLevel > 1) {
            return;
        }
        console.log(...message);
    }

    static warn(...message: any[]) {
        if (Logger.loggerLevel > 2) {
            return;
        }
        console.warn(...message);
    }

    static error(...message: any[]) {
        if (Logger.loggerLevel > 3) {
            return;
        }
        console.error(...message);
    }
}
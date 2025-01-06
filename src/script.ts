import fs from "fs";
import { Parser } from "./parser";
import Interprit from "./interprit";
import Logger from "./log";

export async function evalFile(
    fileName: string,
    params: Array<string> | undefined
): Promise<number> {
    if (!fs.existsSync(fileName)) {
        Logger.error(`file not found: ${fileName}`);
        return -1;
    }
    try {
        const text = fs.readFileSync(fileName, "utf-8");
        const parser = new Parser();
        const executeList = parser.parse(text);
        const interprit = new Interprit(params);
        await interprit.run(executeList);
    } catch (e) {
        return -1;
    }
    return 0;
}

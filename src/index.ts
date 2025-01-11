import minimist from "minimist";
import { evalFile } from "./script";
import { ScriptMode } from "./types";

const p = require("../package.json");
const help = `
VERSION: ${p.version}
USAGE: hcs [OPTIONS] file parameters...

OPTIONS:
    -h              display this help.
    -s              no display http response
    -S              step mode
    -v              verbose mode
`;

function setupScriptMode(argv: minimist.ParsedArgs): ScriptMode {
    const mode: ScriptMode = {
        silent: false,
        step: false,
        verbose: false,
    };

    if (argv["s"] != undefined) {
        mode.silent = true;
    }
    if (argv["S"] != undefined) {
        mode.step = true;
    }
    if (argv["v"] != undefined) {
        mode.verbose = true;
    }

    return mode;
}

(function () {
    const argv = minimist(process.argv.slice(2));
    const mode = setupScriptMode(argv);

    if (argv["h"] != undefined) {
        console.log(help);
        return;
    }

    const cmdlines = argv._;
    if (cmdlines.length === 0) {
        console.error("no input");
        console.log(help);
        process.exit(1);
    }

    const cmdlineParam: Array<string> = [];
    const scriptFile = cmdlines[0];
    for (var i = 1; i < cmdlines.length; i++) {
        cmdlineParam.push(cmdlines[i]);
    }

    evalFile(scriptFile, cmdlineParam, mode)
        .then((ret) => {
            process.exit(ret);
        })
        .catch((e) => {
            process.exit(1);
        });
})();

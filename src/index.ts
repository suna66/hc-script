import minimist from "minimist";
import { evalFile } from "./script";

const p = require("../package.json");
const help = `
VERSION: ${p.version}
USAGE: hcs [OPTIONS] file parameters...

OPTIONS:
    -h              display this help.
`;

(function () {
    const argv = minimist(process.argv.slice(2));

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

    evalFile(scriptFile, cmdlineParam).then((ret) => {
        process.exit(ret);
    }).catch((e) => {
        process.exit(1);
    });
})();

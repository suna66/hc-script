#!/usr/bin/env node
fs = require("fs");
if (fs.existsSync("./dist/main.js")) {
    require("../dist/main.js");
} else {
    require("./main.js");
}

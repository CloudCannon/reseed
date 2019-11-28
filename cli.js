#!/usr/bin/env node
const meow = require("meow");
const path = require("path");
const runner = require("./lib/runner");

const cli = meow(
    "Try --help", 
    {
    flags: {
		source: {
			type: 'string',
			alias: 's'
        },
        dist: {
            type: 'string',
            alias: 'd'
        },
        baseurl: {
            type: 'string',
            alias: 'b'
        }
	}
});

let source = cli.flags["s"] || process.cwd();
let destination = cli.flags["d"] || path.join(process.cwd(), "_dist");
let baseurl = cli.flags["b"];
let options = {
    cwd: process.cwd()
};

if (!source) {
    console.log("No source directory specified. Type dist --help for more information.");
    process.exit(1);
}

if (!destination) {
    console.log("No destination directory specified. Type dist --help for more information.");
    process.exit(1);
}

if (!baseurl) {
    console.log("No baseurl specified. Type dist --help for more information.");
    process.exit(1);
}

// TODO handle the following:
// $ dist build 
// $ dist serve 
// $ dist watch 

async function run() {
    let date = new Date()
    let startTime = date.getTime();
    
    await runner.build(source, destination, baseurl, options);
    
    let end = new Date();
    let elapsedTime = end.getTime() - startTime;
    console.log("process completed in " + elapsedTime + " ms");
}

run();
#!/usr/bin/env node
const meow = require("meow");
const path = require("path");
const runner = require("./lib/runner");
const defaults = require("defaults");

const helpString = `
usage: dist -b | --baseurl <baseurl> [-d | --dest <destination>] [-s]
`

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

function checkRequiredFlags(requiredFlags) {
    for (let flag in requiredFlags){
        if ( !(flag in requiredFlags) ){
            console.log(requiredFlags);
            process.exit(1);
        }
    }
    return true;
}

let source = cli.flags["s"] || "dist/site"
let destination = cli.flags["d"] || "dist/prod"
let baseurl = cli.flags["b"];

let options = {
    cwd: process.cwd(),

    dist: {
        src: source,
        dest: destination,
        baseurl: baseurl
    },
    serve: {
        port: 9000,
        open: true,
        path: "/"
    }
};

let command = cli.input[0] || "dist";

async function run() {
    let date = new Date()
    let startTime = date.getTime();
    
    switch (command) {
        case "clean":
            if (checkRequiredFlags(["dist"])){
                runner.clean(cli.flags["dist"]);
            }
            break;
        case "dist":
            if (checkRequiredFlags(["baseurl"])){
                runner.dist( options );
            }
            break;
        default:
            console.log("command not recognized")
    }
    
    let end = new Date();
    let elapsedTime = end.getTime() - startTime;
    console.log("process completed in " + elapsedTime + " ms");
}
run();
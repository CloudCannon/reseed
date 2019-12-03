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

/**
 * Checks if the required flags for a command were given by the user.
 * 
 * @param {string[]} requiredFlags An array of the required flags for the command (in any order).
 */
function checkRequiredFlags( requiredFlags ) {
    if ( requiredFlags.every(flag => { return flag in cli.flags; }) ) return true;

    console.log("required flags:")
    console.log( requiredFlags );
    process.exit(1);
}

let source = cli.flags["s"] || "dist/site"
let destination = cli.flags["d"] || "dist/prod"
let baseurl = cli.flags["b"] || "";

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
runner.setOptions(options);

let command = cli.input[0] || "dist";

async function run() {
    let date = new Date()
    let startTime = date.getTime();
    
    
    switch (command) {

        case "build":
            if ( checkRequiredFlags([]) ){
                runner.build()
            }

        case "clean":
            if ( checkRequiredFlags(["dist"]) ){
                runner.clean();
            }
            break;

        case "clone-assets":
            if ( checkRequiredFlags(["baseurl"]) ){
                runner.clone_assets();
            }
            break; 
        
        case "dist":
            if ( checkRequiredFlags(["baseurl"]) ){
                runner.dist();
            }
            break;

        case "rewrite-css":
            if ( checkRequiredFlags(["baseurl"]) ){
                runner.rewrite_css();
            }
            break;

        case "rewrite-html":
            if ( checkRequiredFlags(["baseurl"]) ){
                runner.rewrite_html();
            }
            break;    

        case "serve":
            if ( checkRequiredFlags([]) ) {
                runner.serve();
            }
            break;

        case "watch":
            if ( checkRequiredFlags([]) ) {
                runner.watch();
            }

        default:
            console.log("command not recognized")
    }
    
    let end = new Date();
    let elapsedTime = end.getTime() - startTime;
    console.log("process completed in " + elapsedTime + " ms");
}
run();
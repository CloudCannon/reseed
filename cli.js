#!/usr/bin/env node
const meow = require("meow");
const runner = require("./lib/runner");

const helpString = `
Usage: dist <command> <flags>
Flags:
    -s | --source   The source folder to clone. Defaults to dist/site.
    -d | --dest     The destination folder to clone the files to. Defaults to dist/prod
    -b | --baseurl  The filename to prepend to the files in the source.
    -p | --port     The portnumber to serve the cloned site on.

Commands:
    --Command--                                                     --Reqd flags--
    build           Compiles HTML and CSS to be run at a baseurl.      --baseurl
    clean           Removes all files from the dest folder.            --dest
    clone-assets    Clones non CSS and HTML files from src to dest.    --baseurl
    rewrite-css     Clones CSS files from src to dest and rewrites     
                    urls to include baseurl.                           --baseurl
    rewrite-html    Clones HTML files from src to dest and rewrites
                    attributes to include baseurl.                     --baseurl
    serve           Runs a local webserver on the dest folder.
    watch           Watches the src folder and triggers builds.
`

const defaultSrc = "dist/site"
const defaultDest = "dist/prod";
const defaultPort = 9000;

const cli = meow(
    helpString, 
    {
    flags: {
		source: { 
			type: 'string',
			alias: 's'
        },
        dest: {
            type: 'string',
            alias: 'd'
        },
        baseurl: {
            type: 'string',
            alias: 'b'
        },
        port: {
            type: 'string',
            alias: 'p'
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

function checkPortNumber( portString ) {
    if ( !portString ) return NaN;

    let port = parseInt(portString);
    let defaultString = "Reverting to default port (" + defaultPort + ").";

    if ( !port ){
        console.log(portString + " is not a valid port number.");
        console.log(defaultString)
        return NaN;
    }

    if ( port < 1024 || port > 65535 ) {
        console.log("Port number outside of allowed range. (1024 - 65535).");
        console.log(defaultString);
        return NaN;
    }

    return port;
}

let source = cli.flags["s"] || defaultSrc;
let destination = cli.flags["d"] || defaultDest;
let baseurl = cli.flags["b"] || "";
let port = checkPortNumber(cli.flags["p"]) || defaultPort;

let options = {
    cwd: process.cwd(),

    dist: {
        src: source,
        dest: destination,
        baseurl: baseurl
    },
    serve: {
        port: port,
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
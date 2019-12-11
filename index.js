#!/usr/bin/env node
const cli = require('./cli');
const meow = require('meow');
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


const inputs = meow(
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

async function run(){
    const exitCode = await cli.run( inputs );
    console.log("exit code: " + exitCode);
    if (exitCode) process.exit(exitCode);
}
run()



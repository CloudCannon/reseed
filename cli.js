const meow = require("meow");
const runner = require("./lib/runner");
const path = require("path");
const log = require('fancy-log');
const chalk = require('chalk');



const command = ( func, requiredFlags = []) => {
    return {
        run: func,
        requiredFlags: requiredFlags
    }
}


const commands = {
    "build": command(runner.build, ["baseurl"]),
    "clean": command(runner.clean, ["dest"]),
    "clone-assets": command(runner.clone_assets, ["baseurl"]),
    "dist": command(runner.dist, ["baseurl"]),
    "rewrite_css": command(runner.rewrite_css, ["baseurl"]),
    "rewrite-html": command(runner.rewrite_html, ["baseurl"]),
    "serve": command(runner.serve),
    "watch": command(runner.watch)
}


const defaultSrc = "dist/site"
const defaultDest = "dist/prod";
const defaultPort = 9000;



module.exports = { 
    /**
     * Checks if the required flags for a command were given by the user.
     * 
     * @param {string[]} requiredFlags An array of the required flags for the command (in any order).
     */
    checkRequiredFlags: function ( enteredFlags, requiredFlags ) {
        if ( requiredFlags.every(flag => { return flag in enteredFlags; }) ) return true;

        log.error( chalk.red("required flags:") );
        log.error( chalk.red( requiredFlags ) );
        return false;
    },

    /**
     * 
     * @param {string} portString 
     */
    checkPortNumber: function ( portString ) {
        if ( !portString ) return;

        let port = parseInt(portString);
        let defaultString = "Reverting to default port (" + defaultPort + ").";

        if ( !port ){
            log.error(chalk.yellow(portString + " is not a valid port number."));
            log.error(chalk.yellow(defaultString));
            return;
        }

        if ( port < 1024 || port > 65535 ) {
            log.error(chalk.yellow("Port number outside of allowed range. (1024 - 65535)."));
            log.error(chalk.yellow(defaultString));
            return;
        }

        return port;
    },
    
    setOptions: function ( flags ){
        const source = flags["source"] || defaultSrc;
        const destination = flags["dest"] || defaultDest;
        const baseurl = flags["baseurl"] || "";
        const port = this.checkPortNumber(flags["port"]) || defaultPort;
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

        options.dist.fullPathToSource = path.resolve(options.cwd, options.dist.src);
        options.dist.fullPathToDest = path.resolve(options.cwd, options.dist.dest, baseurl);
        return options;
    },

    run: async function ( cli ) {

        let options = this.setOptions( cli.flags );

        let date = new Date()
        let startTime = date.getTime();

        let cmd = cli.input[0] || "dist";
        
        if (commands[cmd]){
            if (this.checkRequiredFlags(cli.flags, commands[cmd].requiredFlags)){
                await commands[cmd].run.call(runner, options); //run function in the context of the runner module.
            } 
        } else {
            log(chalk.red("command not recognized"));
        }

        let end = new Date();
        let elapsedTime = end.getTime() - startTime;
        log(chalk.yellow("⏱  process completed in " + elapsedTime + " ms. "));
    }
    
}
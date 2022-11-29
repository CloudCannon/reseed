const path = require('path');
const log = require('fancy-log');
const chalk = require('chalk');

const runner = require('./lib/runner');

/**
* Factory function for creating commands.
* @param {function} func The function that calling this command will run. These functions
* are usually included in the runner class. Implementing new functionality should
* be done n runner.js.
* @return {Object} The command.
*/
const createCommand = (func, requiredFlags = []) => ({
	run: func,
	requiredFlags: requiredFlags
});

/**
 The different commands for operation. New commands can be specified here.
 Each command requires a function to run, and a list of required flags.
 Required flags will be checked before the command is run.
*/
const commands = {
	/* eslint-disable quote-props */
	'build': createCommand(runner.build, ['baseurl', 'dest']),
	'clean': createCommand(runner.clean, ['dest']),
	'clone-assets': createCommand(runner.clone_assets, ['baseurl', 'dest']),
	'reseed': createCommand(runner.build, ['baseurl', 'dest']),
	'rewrite-css': createCommand(runner.rewrite_css, ['baseurl', 'dest']),
	'rewrite-html': createCommand(runner.rewrite_html, ['baseurl', 'dest']),
	'rewrite-sitemap': createCommand(runner.rewrite_sitemap, ['baseurl', 'dest']),
	'serve': createCommand(runner.buildAndServe, ['baseurl', 'dest']),
	'watch': createCommand(runner.watch, ['baseurl', 'dest'])
	/* eslint-enable quote-props */
};

const defaultSrc = './';
const defaultPort = 9000;

module.exports = {
	/**
	 * Checks if the required flags for a command were given by the user.
	 *
	 * @param {string[]} requiredFlags An array of the required flags for the command (in any order).
	 */
	checkRequiredFlags: function (enteredFlags, requiredFlags) {
		if (requiredFlags.every((flag) => flag in enteredFlags)) {
			return true;
		}

		log.error(chalk.red('required flags:'));
		log.error(chalk.red(requiredFlags));
		return false;
	},

	/**
	 * Checks a given port number to see if it is valid.
	 *
	 * @param {string} portString
	 * @returns {number} The number representation of portString on no-error.
	 * Returns the default port number on error.
	 */
	checkPortNumber: function (portString) {
		if (!portString) {
			return;
		}

		const port = parseInt(portString, 10);
		const defaultString = `Reverting to default port (${defaultPort}).`;

		if (!port) {
			log.error(chalk.yellow(`${portString} is not a valid port number.`));
			log.error(chalk.yellow(defaultString));
			return;
		}

		if (port < 1024 || port > 65535) {
			log.error(chalk.yellow('Port number outside of allowed range. (1024 - 65535).'));
			log.error(chalk.yellow(defaultString));
			return;
		}

		return port;
	},

	/**
	* Function that ajusts the options that the cli runs on.
	*
	* @param {Object} Flags the flags that were set by the user in the command line.
	* @return {Object} An object containing information on how to run the given CLI command.
	*/
	setOptions: function (flags) {
		const cwd = process.cwd();

		// trim leading and trailing slashes
		const source = (flags.source || defaultSrc).replace(/^\/|\/$/g, '');
		const destination = flags.dest.replace(/^\/|\/$/g, '');
		const baseurl = flags.baseurl.replace(/^\/|\/$/g, '');
		const sitemap = (flags.sitemap || 'sitemap.xml').replace(/^\/|\/$/g, '');
		const rss = (flags.rss || '').replace(/^\/|\/$/g, '');

		const port = this.checkPortNumber(flags.port) || defaultPort;
		const split = flags.split || 1;
		const partition = flags.partition || 1;
		const extraSrcAttrs = flags.extrasrc || [];

		const options = {
			cwd: cwd,

			paths: {
				src: source,
				dest: destination,
				baseurl: baseurl,
				sitemap: sitemap,
				rss: rss,
				fullPathToSource: path.resolve(cwd, source),
				fullPathToDest: path.resolve(cwd, destination, baseurl)
			},
			serve: {
				port: port,
				open: true,
				path: '/'
			},
			flags: {
				extraSrcAttrs: extraSrcAttrs,
				overwrite: flags.overwrite,
				split: split,
				partition: partition
			}
		};

		return options;
	},

	/**
	 * Takes the command line arguments and runs the appropriate commands.
	 *
	 * @param {Object} cli The meow object that handled the user input.
	 * @return {int} Returns the exit code of the operation. (0) means no error,
	 * non-zero means an error occured.
	 */
	run: async function (cli) {
		const cmd = cli.input[0] || 'reseed';
		if (!commands[cmd]) {
			log(chalk.red('command not recognized'));
			log(cli.help);
			return 2;
		}

		if (!this.checkRequiredFlags(cli.flags, commands[cmd].requiredFlags)) {
			return 2;
		}

		const options = this.setOptions(cli.flags);

		const date = new Date();
		const startTime = date.getTime();

		// run function in the context of the runner module.
		let exitCode = 0;
		const exit = await commands[cmd].run.call(runner, options);
		if (typeof exit === 'number') {
			exitCode = exit;
		}

		const end = new Date();
		const elapsedTime = end.getTime() - startTime;
		log(chalk.yellow(`⏱  process completed in ${elapsedTime} ms. `));

		return exitCode;
	}
};

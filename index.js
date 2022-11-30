#!/usr/bin/env node
const meow = require('meow');
const cli = require('./cli');

const helpString = `
Usage: reseed <command> <options>

Commands:
    build             Compiles HTML and CSS to be run at a baseurl
    clean             Removes all files from the dest folder
    clone-assets      Clones non CSS and HTML files from src to dest
    rewrite-css       Clones CSS files from src to dest and rewrites urls to include baseurl
    rewrite-html      Clones HTML files from src to dest and rewrites attributes to include baseurl
    rewrite-sitemap   Finds all sitemap files based on index sitemap, and rewrites links to include baseurl
    rewrite-rss       Clones specified RSS file from src to dest and rewrites links to include baseurl
    serve             Runs 'build' then a local webserver on the dest folder
    watch             Watches the src folder and triggers builds

'clean' requires --dest option set
All other commands require both --baseurl and --dest options set.

Options:
    -s | --source     The source folder to clone. Defaults to current directory.
    -d | --dest       The destination folder to clone the files to.
    -b | --baseurl    The base-URL to prepend to the files once copied
    -p | --port       The portnumber to serve the cloned site on
    -e | --extrasrc   A list of extra src attributes to be rewritten
    -m | --sitemap    A path to a valid sitemap or sitemapindex file
    -r | --rss        A glob to a valid RSS file or files
    -o | --overwrite  When cleaning --dest, don't prompt for confirmation
         --split      The number of partitions to divide files into
         --partition  The partition number to process
`;

/**
 * Takes input from user via command line and outputs an object containing
 * arguments (in camelCase) and flags.
 */
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
			},
			extrasrc: {
				type: 'string',
				alias: 'e',
				isMultiple: true
			},
			rss: {
				type: 'string',
				alias: 'r'
			},
			sitemap: {
				type: 'string',
				alias: 'm'
			},
			overwrite: {
				type: 'boolean',
				alias: 'o'
			},
			split: {
				type: 'number',
				alias: null,
				default: 1
			},
			partition: {
				type: 'number',
				alias: null,
				default: 1
			}
		}
	}
);

/**
 * Passes inputs to cli.js
 */
async function run() {
	const exitCode = await cli.run(inputs);
	console.log(`exit code: ${exitCode}`);
	if (exitCode) process.exit(exitCode);
}
run();

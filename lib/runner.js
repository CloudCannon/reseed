/* eslint-disable no-underscore-dangle */
const fs = require('fs-extra');
const Path = require('path');
const readlineSync = require('readline-sync');
const util = require('util');
const del = require('del');
const browserSync = require('browser-sync').create();
const chokidar = require('chokidar');
const log = require('fancy-log');

const cssRewrite = require('./processors/css').plugin;
const htmlRewrite = require('./processors/html').plugin;

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const mkdir = util.promisify(fs.mkdirs);
const copy = util.promisify(fs.copy);

const regex = {
	css: /\.s?css$/,
	html: /\.html?$/,
	any: /(:?)/
};

const getFilesRecursive = async (path) => {
	const stats = await stat(path);

	if (stats.isSymbolicLink()) {
		return [];
	}

	if (stats && stats.isDirectory()) {
		// TODO: this could be done with a glob and avoid the recursive call, and regex file checks.
		const files = await readdir(path);

		const promises = files.map((file) => {
			const fullpath = Path.resolve(path, file);

			return getFilesRecursive(fullpath);
		});

		const result = await Promise.all(promises);
		const flattened = result.reduce((acc, val) => acc.concat(val), []);
		return flattened;
	}

	return [path];
};

module.exports = {

	/**
	 * Recursively and asynchronously moves through a directory and
	 * returns the list of files in that directory.
	 * @param {string} dir The current file directory.
	 * @param {string} type The type of files to look for.
	 *
	 * Options: "any":      returns all files in dir.
	 *
	 *          "css":      returns only .css and .scss files.
	 *
	 *          "html":     returns only .html and .htm files.
	 *
	 *          "assets":   returns all files that "css" and "html" does not return.
	 * @return {object} The files grouped by `css`, `html`, and `other`.
	 */
	_fetchFiles: async function (dir, type = 'any', partition) {
		try {
			const { split: _split, partition: _partitionNumber } = {
				split: 1, partition: 1, ...partition
			};
			const filesByType = {
				css: [],
				html: [],
				other: []
			};

			const files = await getFilesRecursive(dir);

			const split = Math.max(_split || 1, 1);
			const partitionNumber = Math.min(split, Math.max(_partitionNumber || 1, 1));
			const fileCount = files.length;
			const partitionSize = fileCount / split;
			const partitionStart = (partitionNumber - 1) * partitionSize;
			const partitionEnd = partitionStart + partitionSize;
			const filePartition = files.slice(partitionStart, partitionEnd);

			filePartition.forEach((file) => {
				const ext = Path.extname(file);

				if (regex.css.test(ext)) {
					filesByType.css.push(file);
				} else if (regex.html.test(ext)) {
					filesByType.html.push(file);
				} else {
					filesByType.other.push(file);
				}
			});

			return filesByType;
		} catch (err) {
			log.error('Could not find files 👀');
			log.error(err);
			return undefined;
		}
	},

	/**
	 * Asynchronously copy the files in fileList from source to destination.
	 * CURRENTLY SLOWEST PART OF PROCESS.
	 *
	 * @param {string[]} fileList The list of files contained in the source.
	*/
	_copyFiles: async function (fileList, options) {
		if (!fileList) {
			log.error('no files to copy');
			return undefined;
		}

		const source = options.dist.fullPathToSource;
		const destination = options.dist.fullPathToDest;

		try {
			await mkdir(destination, { recursive: true }); // create the directory cwd/destination
		} catch (err) {
			log.error('Could not create destination directory');
			log.error(err);
			return;
		}

		try {
			const copiedFiles = await fileList.reduce(async (memo, file) => {
				const copied = await memo;
				if (file) {
					const stub = file.replace(source, ''); // the path of the file, relative to the source.
					const newpath = Path.join(destination, stub);

					try {
						await copy(file, newpath, { overwrite: true });
						copied.push(newpath);
					} catch (err) {
						log.err(err);
					}
				}
				return copied;
			}, Promise.resolve([]));

			return copiedFiles;
		} catch (copyErr) {
			log.err('Error copying files');
			log.err(copyErr);
		}
	},

	/**
	 * Queries the user for a yes/no response.
	 *
	 * @param {String} question The question to ask the user.
	 * @returns {Boolean} True on a yes response, false otherwise.
	 */
	_askYesNo: function (question, responseOverride = false) {
		let response;
		if (responseOverride) {
			response = responseOverride;
		} else {
			response = readlineSync.question(question);
		}
		if (!(response === 'Y' || response === 'y')) {
			log('Process cancelled by user. exiting...');
			return false;
		}
		return true;
	},

	/**
	 * Cleans the files in dest, fetches the files in src.
	 * Rewrite-css is called on the css files, rewrite-html is called on html files, and
	 * clone-assets is called on all other files.
	 *
	 * @param {Object} options The options object.
	 */
	build: async function (options) {
		const { flags } = options;
		const { split, partition } = flags;
		const deletedError = await this.clean(options);
		if (typeof deletedError === 'number') {
			log.error('error cleaning');
			return deletedError; // errored in clean
		}

		const sourceFiles = await this._fetchFiles(options.dist.fullPathToSource, 'any', {
			split: split, partition: partition
		});
		if (!sourceFiles) {
			log.error('Error retrieving sourceFiles');
			return 1;
		}

		const otherFiles = await this.clone_assets(options, sourceFiles.other);
		const cssExitCode = await this.rewrite_css(options, sourceFiles.css);
		const htmlExitCode = await this.rewrite_html(options, sourceFiles.html);

		if (!otherFiles || cssExitCode > 0 || htmlExitCode > 0) {
			log.error('There was an error building your site 😓');
			return 1;
		}
		return 0;
	},

	/**
	 * Deletes dest and all files contained in dest.
	 * TODO Ask user for confirmation before deleting if files exist in dest.
	 * @param {Object} options The options object.
	 */
	clean: async function (options) {
		if (!options.flags.overwrite && fs.pathExistsSync(options.dist.dest)) {
			const question = `Warning: The destination ${options.dist.dest} already exists.`
				+ 'Continuing will delete this folder and everything in it. Do you wish to continue? (Y or N): ';
			const isYes = await this._askYesNo(question);
			if (!isYes) return 1;
		}
		log(`Cleaning ${options.dist.dest}`);
		return del(options.dist.dest);
	},

	/**
	 * Copies all non css and html files from src to dest.
	 * If files is truthy (i.e has more than one file listed), then will run copyFiles on the
	 * list of files specified. Will copy the files from source to destination/baseurl without
	 * altering the data in any way.
	 * If files = null, then fetchfiles will be run to retrieve the files specified in src.
	 * This allows the function to be run from the command line, without passing in a list of files.
	 * @param {Object} options The options object.
	 * @param {[String]} files The list of files to copy (default = null).
	 *
	 * @returns {[String]} The copied files.
	 */
	clone_assets: async function (options, files = null) {
		if (!files) {
			const { flags } = options;
			const { split, partition } = flags;
			const fetchedFiles = await this._fetchFiles(options.dist.fullPathToSource, 'assets', {
				split: split, partition: partition
			});
			if (!fetchedFiles) return 1;
			files = fetchedFiles.other;
		}

		const otherFiles = await this._copyFiles(files, options);
		if (!otherFiles) {
			log.error('Error cloning assets');
			return 1;
		}

		return otherFiles;
	},

	/**
	 * Default command (runs when no command is specified).
	 * Builds, serves, and watches.
	 *
	 * @param {Object} options The options object.
	 * @returns {number} The exit code.
	 */
	dist: async function (options) {
		const exit = await this.build(options);
		if (exit > 0) return exit;
		this.serve(options);
		this.watch(options);
		return 0;
	},

	/**
	 * Rewrites the urls and hrefs in CSS files to include baseurl.
	 * If files is truthy, then takes the files in files, copies them into dest/baseurl
	 * using copyFiles, and rewrites the contents so that urls and hrefs referencing local
	 * content have baseurl prepended to them.
	 * If files is null, then fetch-files is called first to obtain only the css files in src.
	 *
	 * @param {Object} options the options object.
	 * @param {[String]} files the list of files to rewrite (default = null).
	 * @returns {[String]} The copied files (TODO)
	 */
	rewrite_css: async function (options, files = null) {
		const { flags } = options;
		const { split, partition } = flags;

		if (!files) {
			const fetchedFiles = await this._fetchFiles(options.dist.fullPathToSource, 'css', {
				split: split, partition: partition
			});
			if (!fetchedFiles) return 1;
			files = fetchedFiles.css;
		}

		log('copying...');
		const copiedFiles = await this._copyFiles(files, options);
		if (!copiedFiles) {
			log.error('Error copying css files');
			return 1;
		}

		log('rewriting css...');
		copiedFiles.forEach((file) => {
			const exit = cssRewrite(file, options.dist.fullPathToDest, options.dist.baseurl);
			if (exit > 0) return exit; // if error
		});
		return 0;
	},

	/**
	 * Rewrites urls and hrefs in HTML files to include baseurl.
	 * If files is truthy, then takes the files in files, copies them into dest/baseurl
	 * using copyFiles, and rewrites the contents so that urls and hrefs referencing local
	 * content have baseurl prepended to them.
	 * If files is null, then fetch-files is called first to obtain only the html files in src.
	 *
	 * @param {Object} options The options object.
	 * @param {[String]} files The list of files to rewrite (default = null).
	 * @returns {[String]} The copied files (TODO).
	 */
	rewrite_html: async function (options, files = null) {
		const { flags } = options;
		const { split, partition } = flags;

		if (!files) {
			const fetchedFiles = await this._fetchFiles(options.dist.fullPathToSource, 'html', {
				split: split, partition: partition
			});
			if (!fetchedFiles) return 1;
			files = fetchedFiles.html;
		}
		const copiedFiles = await this._copyFiles(files, options);
		if (!copiedFiles) {
			log.error('Error copying html files');
			return 1;
		}

		log('rewriting html...');
		copiedFiles.forEach((file) => {
			const exit = htmlRewrite(file, options.dist.fullPathToDest, options.dist.baseurl);
			if (exit > 0) return exit; // if error
		});
		return 0;
	},

	/**
	 * Serves the files on a local webserver, so that they may be viewed on a browser.
	 *
	 * @param {Object} options The options object.
	 */
	serve: function (options) {
		browserSync.init({
			startPath: options.dist.baseurl,
			server: {
				baseDir: Path.join(options.cwd, options.dist.dest)
			},
			port: options.serve.port
		});
	},

	/**
	 * Continuously watches the dest/baseurl directory to check for changes. If a change
	 * occurs, then the browswer that is viewing the local webserver will be reloaded, so
	 * that the new content can be viewed. Because this process runs continously, it does
	 * not return an exit code and must be cancelled by the user in-terminal.
	 *
	 * @param {Object} options The options object.
	 */
	watch: function (options) {
		log(`watching files on ${options.dist.dest}`);

		chokidar.watch(options.dist.dest).on('all', () => {
			// log(path + ' has been modified (' + event + '). Reloading...');
			setTimeout(browserSync.reload, 1000);
		});
	}
};

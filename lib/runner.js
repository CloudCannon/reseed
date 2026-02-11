/* eslint-disable no-underscore-dangle */
const fs = require('fs-extra');
const { rm } = require('fs/promises');
const glob = require('glob');
const Path = require('path');
const readlineSync = require('readline-sync');
const browserSync = require('browser-sync').create();
const chokidar = require('chokidar');
const log = require('fancy-log');
const { URL } = require('url');

const cssRewrite = require('./processors/css').plugin;
const htmlRewrite = require('./processors/html').plugin;
const xmlRewrite = require('./processors/xml').plugin;

const regex = {
	css: /\.s?css$/i,
	html: /\.html?$/i,
	any: /(:?)/
};

/**
 * Fetches filepaths using a glob.
 *
 * @param {String} dir The directory to base the search in.
 * @param {Object} searchOptions Optional configuration for the search.
 * @return {String[]} The list of filepaths that the glob found.
 */
const getFiles = async (dir, searchOptions) => {
	const globPattern = searchOptions.globPattern || '/**/*.*';
	const { partition, ignorePatterns } = searchOptions;

	const fullGlobPattern = Path.join(dir, globPattern);
	const globOptions = { ...ignorePatterns && { ignore: ignorePatterns } };

	const files = glob.sync(fullGlobPattern, globOptions);

	if (!files.length) {
		log.error('Could not find files 👀');
		return;
	}

	const { split: _split, partition: _partitionNumber } = {
		split: 1, partition: 1, ...partition
	};

	const promises = files.map((file) => Path.resolve(file));
	const result = await Promise.all(promises);

	const split = Math.max(_split || 1, 1);
	const partitionNumber = Math.min(split, Math.max(_partitionNumber || 1, 1));
	const fileCount = result.length;
	const partitionSize = fileCount / split;
	const partitionStart = (partitionNumber - 1) * partitionSize;
	const partitionEnd = partitionStart + partitionSize;
	const filePartition = result.slice(partitionStart, partitionEnd);

	return filePartition;
};

module.exports = {

	/**
	 * Fetches all files in the given directory and sorts them into buckets based on filetype.
	 * @param {string} dir The current file directory.
	 * @param {object} [partition] Partition information for the fetch.
	 * @param {number} partition.split The number of partitions to split into.
	 * @param {number} partition.partition The partition number to process.
	 *
	 * @return {object} The files grouped by `css`, `html`, and `other`.
	 */
	_fetchAllFiles: async function (dir, partition) {
		const filesByType = {
			css: [],
			html: [],
			other: []
		};

		const files = await getFiles(dir, { partition: partition });
		if (!files || !files.length) {
			return;
		}

		files.forEach((file) => {
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
	},

	/**
	 * Asynchronously copy the files in fileList from source to destination.
	 * Currently slowest part of process.
	 *
	 * @param {string[]} fileList The list of files contained in the source.
	 * @param {Object} options The options object.
	*/
	_copyFiles: async function (fileList, options) {
		if (!fileList) {
			log.error('no files to copy');
			return undefined;
		}

		const source = options.paths.fullPathToSource;
		const destination = options.paths.fullPathToDest;

		try {
			fs.mkdirsSync(destination, { recursive: true }); // create the directory cwd/destination
		} catch (err) {
			log.error('Could not create destination directory');
			log.error(err);
			return;
		}

		const copiedFiles = await fileList.reduce(async (memo, file) => {
			const copied = await memo;
			if (file) {
				const stub = file.replace(source, ''); // the path of the file, relative to the source.
				const newpath = Path.join(destination, stub);

				try {
					fs.copySync(file, newpath, { overwrite: true });
					copied.push(newpath);
				} catch (err) {
					log.error(err);
				}
			}
			return copied;
		}, Promise.resolve([]));

		return copiedFiles;
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

		const sourceFiles = await this._fetchAllFiles(options.paths.fullPathToSource, {
			split: split, partition: partition
		});
		if (!sourceFiles) {
			log.error('Error retrieving sourceFiles');
			return 1;
		}

		const cloneExitCode = await this.clone_assets(options, sourceFiles.other);
		const cssExitCode = await this.rewrite_css(options, sourceFiles.css);
		const htmlExitCode = await this.rewrite_html(options, sourceFiles.html);
		const sitemapExitCode = await this.rewrite_sitemap(options);
		const rssExitCode = options.paths.rss ? await this.rewrite_rss(options) : 0;

		const processExitCode = Math.max(
			cloneExitCode || 0,
			cssExitCode || 0,
			htmlExitCode || 0,
			sitemapExitCode || 0,
			rssExitCode || 0
		);

		// Exit code 1 in the function calls above means that there were no files
		// of that type to process, so ignorable (i.e. shouldn't halt process).
		if (processExitCode > 1) {
			log.error('There was an error building your site 😓');
			return processExitCode;
		}
		return 0;
	},

	/**
	 * Deletes dest and all files contained in dest.
	 * @param {Object} options The options object.
	 */
	clean: async function (options) {
		const pathExists = fs.pathExistsSync(options.paths.dest);
		if (!pathExists) {
			return;
		}
		if (!options.flags.overwrite && pathExists) {
			const question = `Warning: The destination ${options.paths.dest} already exists.\nContinuing will delete this folder and everything in it.\nDo you wish to continue? (Y or N): `;
			const isYes = await this._askYesNo(question);
			if (!isYes) return 1;
		}
		log(`Cleaning ${options.paths.dest}`);
		rm(options.paths.dest, { recursive: true, force: true }).catch(() => 1);
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
	 * @returns {number} The exit code.
	 */
	clone_assets: async function (options, files = null) {
		if (!files) {
			const { flags } = options;
			const { split, partition } = flags;
			files = await getFiles(options.paths.fullPathToSource, {
				partition: { split: split, partition: partition },
				ignorePatterns: ['/**/*.htm', '/**/*.html', '/**/*.css', '/**/*.scss']
			});
			if (!files || !files.length) return 1;
		}

		const otherFiles = await this._copyFiles(files, options);
		if (!otherFiles) {
			log.error('Error cloning assets');
			return 4;
		}

		return 0;
	},

	/**
	 * Builds, serves, and watches.
	 *
	 * @param {Object} options The options object.
	 * @returns {number} The exit code.
	 */
	buildAndServe: async function (options) {
		const exit = await this.build(options);
		if (exit > 0) return exit;
		this.serve(options);
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
	 * @returns {number} The exit code.
	 */
	rewrite_css: async function (options, files = null) {
		const { flags } = options;
		const { split, partition } = flags;

		if (!files) {
			files = await getFiles(options.paths.fullPathToSource, {
				partition: { split: split, partition: partition },
				globPattern: '/**/*.css'
			});
			if (!files || !files.length) return 1;
		}

		log('copying...');
		const copiedFiles = await this._copyFiles(files, options);
		if (!copiedFiles) {
			log.error('Error copying css files');
			return 4;
		}

		log('rewriting css...');
		copiedFiles.forEach((file) => {
			const exit = cssRewrite(file, options.paths.fullPathToDest, options.paths.baseurl);
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
	 * @returns {number} The exit code.
	 */
	rewrite_html: async function (options, files = null) {
		const { flags } = options;
		const { split, partition } = flags;

		if (!files) {
			files = await getFiles(options.paths.fullPathToSource, {
				partition: { split: split, partition: partition },
				globPattern: '/**/*.htm?'
			});
			if (!files || !files.length) return 1;
		}
		const copiedFiles = await this._copyFiles(files, options);
		if (!copiedFiles) {
			log.error('Error copying html files');
			return 4;
		}

		log('rewriting html...');
		copiedFiles.forEach((file) => {
			const exit = htmlRewrite(
				file,
				options.paths.fullPathToDest,
				options.paths.baseurl,
				options.flags.extraSrcAttrs
			);
			if (exit > 0) return exit; // if error
		});
		return 0;
	},

	/**
	 * Rewrites urls in sitemap file(s) to include baseurl.
	 * If the intial sitemap is a sitemapindex, the referenced sitemaps will be passed back
	 * into this function to also be rewritten.
	 *
	 * @param {Object} options The options object.
	 * @param {[String]} files The list of files to rewrite (default = null).
	 * @returns {number} The exit code.
	 */
	rewrite_sitemap: async function (options, files = null) {
		if (!files) {
			files = await getFiles(options.paths.fullPathToSource,
				{ globPattern: options.paths.sitemap });
			if (!files || !files.length) return 1;
		}
		const copiedFiles = await this._copyFiles(files, options);
		if (!copiedFiles) {
			return 4;
		}

		if (options.fromIndex) {
			copiedFiles.forEach((file) => {
				const exit = xmlRewrite(file, options.paths.fullPathToDest, options.paths.baseurl);
				if (exit > 0) return exit; // if error
			});
		} else {
			log('rewriting sitemap...');
			const file = copiedFiles[0];
			const exit = xmlRewrite(file, options.paths.fullPathToDest, options.paths.baseurl);
			if (Array.isArray(exit) && !options.fromIndex) {
				options.fromIndex = true;

				const linkedFiles = exit.reduce((pathList, path) => {
					try {
						const url = new URL(path);
						const filePath = Path.join(options.paths.fullPathToSource, url.pathname);
						pathList.push(filePath);
						return pathList;
					} catch (urlError) {
						return pathList;
					}
				}, []);

				return this.rewrite_sitemap(options, linkedFiles);
			}
		}

		return 0;
	},

	/**
	 * Rewrites <link>s in an RSS file to include baseurl.
	 *
	 * @param {Object} options The options object.
	 * @returns {number} The exit code.
	 */
	rewrite_rss: async function (options) {
		const files = await getFiles(options.paths.fullPathToSource,
			{ globPattern: options.paths.rss });
		if (!files || !files.length) {
			return 1;
		}

		const copiedFiles = await this._copyFiles(files, options);
		if (!copiedFiles) {
			return 4;
		}

		log('rewriting RSS file(s)...');
		copiedFiles.forEach((file) => {
			const ext = Path.extname(file);
			if (!(/\.xml$/ig).test(ext)) {
				log.error(`RSS file must have .xml extension (reading ${file})`);
			}
			xmlRewrite(file, options.paths.fullPathToDest, options.paths.baseurl);
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
			startPath: options.paths.baseurl,
			server: {
				baseDir: Path.join(options.cwd, options.paths.dest)
			},
			port: options.serve.port
		});
		this.watch(options);
	},

	/**
	 * Continuously watches the src directory to check for changes. If a change
	 * occurs, then a new build is triggered, and the browser is then reloaded.
	 * Because this process runs continously, it does not return an exit code
	 * and must be cancelled by the user in-terminal.
	 *
	 * @param {Object} options The options object.
	 */
	watch: function (options) {
		log(`watching files on ${options.paths.src}`);
		options.flags.overwrite = true;

		const watchOptions = {
			awaitWriteFinish: {
				stabilityThreshold: 1000
			}
		};

		const reload = async () => {
			const exit = await this.build(options);
			if (exit > 0) return exit;
			browserSync.reload();
		};

		chokidar.watch(options.paths.src, watchOptions).on('change', (event, path) => {
			log(`${path} has been modified (${event}). Reloading...`);
			reload();
		});

		return 0;
	}
};

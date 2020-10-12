// const PluginError = require('plugin-error');
const { URLRewriter } = require('cssurl');
const path = require('path');
const fs = require('fs-extra');
const log = require('fancy-log');

const IGNORE_URL_REGEX = /^([a-z]+:|\/\/|#)/;

function prepHref(href) {
	return `'${href.replace(/'/g, "'")}'`;
}

/**
 *
 *
 * @param {string} css The css code in string format.
 * @param {*} sitePath The relative path to the dist'd site.
 * @param {*} baseurl The baseurl to prepend to the source files.
 */
function rewriteCSS(css, sitePath, baseurl) {
	const rewriter = new URLRewriter((href) => {
		if (IGNORE_URL_REGEX.test(href)) {
			return prepHref(href);
		}

		const absolutePath = path.resolve(path.dirname(sitePath), href);
		return prepHref(`/${path.join(baseurl, absolutePath)}`);
	});

	return rewriter.rewrite(css);
}

module.exports = {
	rewrite: rewriteCSS,

	/** Handles rewriting urls in css files.
	 *
	 * @param {string} file the absolute path to the css file.
	 * @param {string} destination the absolute path to the destination directory.
	 * @param {string} baseurl the baseurl to prepend to the source files.
	 */
	plugin: function (file, destination, baseurl) {
		if (!file) {
			log.error('Error rewriting CSS: Invalid file specified.');
			return 1;
		}
		if (!destination || !baseurl) {
			log.error('Error rewriting CSS: No destination specified.');
			return 1;
		}
		const contents = fs.readFileSync(file);
		const css = contents.toString('utf-8');
		let sitePath = `/${file.substring(destination.length + 1)}`;
		sitePath = sitePath.replace(/\/index.html?/i, '/');
		if (!css) {
			return 0;
		}
		const rewritten = rewriteCSS(css, sitePath, baseurl);
		fs.writeFileSync(file, rewritten);
		return 0;
	}
};

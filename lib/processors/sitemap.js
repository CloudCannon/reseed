const fs = require('fs-extra');
const cheerio = require('cheerio');
const log = require('fancy-log');
const { URL } = require('url');
const Path = require('path');

let extraPaths = [];

function rewritePath(baseurl, link) {
	try {
		const url = new URL(link);
		const newPath = Path.join(baseurl, url.pathname);
		const rewrittenUrl = new URL(newPath, url.origin);
		return rewrittenUrl.toString();
	} catch (urlError) {
		return link;
	}
}

function rewriteXML(xml, baseurl) {
	const $ = cheerio.load(xml, {
		xmlMode: true
	});

	const rootNode = $.root().children()[0];
	const isIndex = rootNode && rootNode.name === 'sitemapindex';

	$('loc').each(function () {
		const $el = $(this);
		const originalValue = $el.text();
		const updated = rewritePath(baseurl, originalValue);
		$el.text(updated);

		if (isIndex && $el.parent()[0].name === 'sitemap') {
			extraPaths.push(originalValue);
		}
	});

	$('xhtml\\:link').each(function () {
		const $el = $(this);
		const originalValue = $el.attr('href');
		const updated = rewritePath(baseurl, originalValue);
		$el.attr('href', updated);
	});
	return $.xml();
}

module.exports = {
	rewrite: rewriteXML,

	/** Handles rewriting urls in sitemap(s)
	 *
	 * @param {string} file the absolute path to the sitemap file.
	 * @param {string} destination the absolute path to the destination directory.
	 * @param {string} baseurl the baseurl to prepend to the source files.
	 */
	plugin: function (file, destination, baseurl) {
		extraPaths = [];
		if (!file) {
			log.error('Error rewriting XML: Invalid file specified.');
			return 1;
		}
		if (!destination || !baseurl) {
			log.error('Error rewriting XML: No destination specified.');
			return 1;
		}
		const contents = fs.readFileSync(file);
		const xml = contents.toString('utf-8');

		if (!xml) {
			return 0;
		}
		const rewritten = rewriteXML(xml, baseurl);

		fs.writeFileSync(file, rewritten);
		return extraPaths.length ? extraPaths : 0;
	}
};

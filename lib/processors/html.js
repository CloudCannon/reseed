const fs = require('fs-extra');
const cheerio = require('cheerio');
const srcsetParser = require('srcset');
const path = require('path');
const log = require('fancy-log');
const rewriteCSS = require('./css').rewrite;

const IGNORE_URL_REGEX = /^([a-z]+:|\/\/|#)/;

function rewritePath(sitePath, baseurl, href) {
	if (IGNORE_URL_REGEX.test(href)) {
		return href;
	}

	const absolutePath = path.resolve(path.dirname(sitePath), href);
	return path.join('/', baseurl, absolutePath);
}

function rewriteHTML(html, sitePath, baseurl, extraSrcAttrs) {
	extraSrcAttrs = extraSrcAttrs || [];

	const $ = cheerio.load(html, {
		_useHtmlParser2: true,
		lowerCaseAttributeNames: false,
		decodeEntities: false
	});

	$('[href]').not('[reseed-ignore]').each(function () {
		const $el = $(this);
		const href = $el.attr('href');
		const updated = rewritePath(sitePath, baseurl, href);

		if (updated !== href) {
			$el.attr('href', updated);
		}
	});

	const srcAttrs = ['src', 'poster'].concat(extraSrcAttrs);
	for (let i = 0; i < srcAttrs.length; i += 1) {
		const srcAttr = srcAttrs[i];
		$(`[${srcAttr}]`).not('[reseed-ignore]').each(function () {
			const $el = $(this);
			const originalValue = $el.attr(srcAttr);
			const updated = rewritePath(sitePath, baseurl, originalValue);

			if (updated !== originalValue) {
				$el.attr(srcAttr, updated);
			}
		});
	}

	$('[srcset]').not('[reseed-ignore]').each(function () {
		const $el = $(this);
		const srcset = $el.attr('srcset');
		const parsed = srcsetParser.parse(srcset);

		for (let i = 0; i < parsed.length; i += 1) {
			parsed[i].url = rewritePath(sitePath, baseurl, parsed[i].url);
		}

		const updated = srcsetParser.stringify(parsed);

		if (updated !== srcset) {
			$el.attr('srcset', updated);
		}
	});

	$("meta[http-equiv='refresh']").not('[reseed-ignore]').each(function () {
		const $el = $(this);
		const content = $el.attr('content');
		const parts = content.split(';');

		for (let i = 0; i < parts.length; i += 1) {
			if (parts[i].indexOf('url=') === 0) {
				const href = parts[i].substring(4);
				const updated = rewritePath(sitePath, baseurl, href);

				if (updated !== href) {
					parts[i] = `url=${updated}`;
					$el.attr('content', parts.join(';'));
				}
				return;
			}
		}
	});

	$('[style]').not('[reseed-ignore]').each(function () {
		const $el = $(this);
		const css = $el.attr('style');
		const updated = rewriteCSS(css, sitePath, baseurl);

		if (updated !== css) {
			$el.attr('style', updated);
		}
	});

	$('style').not('[reseed-ignore]').each(function () {
		const $el = $(this);
		const css = $el.html();
		const updated = rewriteCSS(css, sitePath, baseurl);

		if (updated !== css) {
			$el.html(updated);
		}
	});

	return $.html();
}

module.exports = {
	rewrite: rewriteHTML,

	/**
	 * Handles rewriting urls in html files.
	 *
	 * @param {string} file the absolute path to the css file.
	 * @param {string} destination the absolute path to the destination directory.
	 * @param {string} baseurl the baseurl to prepend to the source files.
	 */
	plugin: function (file, destination, baseurl, extraSrcAttrs) {
		if (!file) {
			log.error('Error rewriting HTML: Invalid file specified');
			return 2;
		}

		if (!destination || !baseurl) {
			log.error('Error rewriting HTML: No destination specified');
			return 3;
		}
		const contents = fs.readFileSync(file);
		const html = contents.toString('utf-8');
		let sitePath = path.join('/', file.substring(destination.length + 1));
		sitePath = sitePath.replace(/\/index.html?/i, '/');

		if (!html) {
			console.log('NO CONTENTS');
			return 0;
		}

		const rewritten = rewriteHTML(html, sitePath, baseurl, extraSrcAttrs);

		fs.writeFileSync(file, rewritten);
		return 0;
	}
};

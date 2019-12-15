const fs = require("fs-extra");
const cheerio = require("cheerio");
const srcsetParser = require("srcset");
const path = require("path");
const rewriteCSS = require("./css").rewrite;
const IGNORE_URL_REGEX = /^([a-z]+\:|\/\/|\#)/;

function rewritePath(sitePath, baseurl, href) {
	if (IGNORE_URL_REGEX.test(href)) {
		return href;
	}

	let absolutePath = path.resolve(path.dirname(sitePath), href);
	return "/" + path.join(baseurl, absolutePath);
}

function rewriteHTML(html, sitePath, baseurl, extraSrcAttrs) {
	extraSrcAttrs = extraSrcAttrs || [];

	var $ = cheerio.load(html, { _useHtmlParser2: true, lowerCaseAttributeNames:false, decodeEntities: false });

	$("[href]").each(function () {
		var $el = $(this),
			href = $el.attr("href"),
			updated = rewritePath(sitePath, baseurl, href);

		if (updated !== href) {
			$el.attr("href", updated);
		}
	});


	let srcAttrs = ["src", "poster"].concat(extraSrcAttrs);
	for (let i = 0; i < srcAttrs.length; i++) {
		const srcAttr = srcAttrs[i];

		$("[" + srcAttr + "]").each(function () {
			var $el = $(this),
				originalValue = $el.attr(srcAttr),
				updated = rewritePath(sitePath, baseurl, originalValue);

			if (updated !== originalValue) {
				$el.attr(srcAttr, updated);
			}
		});
	}
	
	$("[srcset]").each(function () {
		var $el = $(this),
			srcset = $el.attr("srcset"),
			parsed = srcsetParser.parse(srcset);

		for (var i = 0; i < parsed.length; i++) {
			parsed[i].url = rewritePath(sitePath, baseurl, parsed[i].url);
		}

		var updated = srcsetParser.stringify(parsed);

		if (updated !== srcset) {
			$el.attr("srcset", updated);
		}
	});

	$("meta[http-equiv='refresh']").each(function () {
		var $el = $(this),
			content = $el.attr("content"),
			parts = content.split(";");

		for (var i = 0; i < parts.length; i++) {
			if (parts[i].indexOf("url=") === 0) {
				var href = parts[i].substring(4),
					updated = rewritePath(sitePath, baseurl, href);

				if (updated !== href) {
					parts[i] = "url=" + updated;
					$el.attr("content", parts.join(";"));
				}
				return;
			}
		}
	});

	
	$("[style]").each(function () {
		var $el = $(this),
			css = $el.attr("style"),
			updated = rewriteCSS(css, sitePath, baseurl);

		if (updated !== css) {
			$el.attr("style", updated);
		}
	});

	$("style").each(function () {
		var $el = $(this),
			css = $el.html(),
			updated = rewriteCSS(css, sitePath, baseurl);

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
	plugin: function (file, destination, baseurl) {

		if (!file){
			console.log("Invalid file specified")
			return 1;
		}

		if (!destination || !baseurl){
			console.log("No destination specified");
			return 1;
		}

		let sitePath = "/" + file.substring(destination.length + 1);
		sitePath = sitePath.replace(/\/index.html?/i, "/");

		let contents = fs.readFileSync(file);
		if (!contents){
			return 0;
		}

		let rewritten = rewriteHTML(contents, sitePath, baseurl);

		fs.writeFileSync(file, rewritten);
		return 0;
	}
};
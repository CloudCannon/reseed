//const PluginError = require("plugin-error");
const URLRewriter = require("cssurl").URLRewriter;
const path = require("path");
const fs = require("fs-extra");

const IGNORE_URL_REGEX = /^([a-z]+\:|\/\/|\#)/;

function prepHref(href) {
	return "'" + href.replace(/'/g, "\'") + "'";
}

/**
 * 
 * 
 * @param {string} css The css code in string format
 * @param {*} sitePath The absolute path to the site
 * @param {*} baseurl 
 */
function rewriteCSS(css, sitePath, baseurl) {
	let rewriter = new URLRewriter(function(href) {
		if (IGNORE_URL_REGEX.test(href)) {
			return prepHref(href);
		}
		
		let absolutePath = path.resolve(path.dirname(sitePath), href);
		return prepHref("/" + path.join(baseurl, absolutePath));
	});

	return rewriter.rewrite(css);
}

module.exports = {
	rewrite: rewriteCSS,
	
	/**
	 * 
	 * @param {string} file the path to the css file.
	 * @param {*} options 
	 */
    plugin: function (file, destination, options = {}) {
        options = options || {};
        if (!file) {
            return;
		}

		let contents = fs.readFileSync(file);
		let css = contents.toString("utf-8");

		let sitePath = "/" + file.substring(destination.length + 1);
		sitePath = sitePath.replace(/\/index.html?/i, "/");
		
		if (!css){
			return;
		}
		let rewritten = rewriteCSS(css, sitePath, options.baseurl);

		fs.writeFileSync(file, rewritten);
    }
}

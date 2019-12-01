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
 * @param {string} css The css code in string format.
 * @param {*} sitePath The absolute path to the site.
 * @param {*} baseurl The baseurl to prepend to the source files.
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
	
	/** Handles rewriting urls in css files.
	 * Returns 1
	 * 
	 * @param {string} file the path (from root) to the css file.
	 * @param {Object} options 
	 */
    plugin: function (file, destination, options = {}) {
		options = options || {};
        if (!file) {
			console.log("Invalid file specified")
            return;
		}
		if (!destination){
			console.log("")
			return;
		}

		let contents = fs.readFileSync(file);
		let css = contents.toString("utf-8");

		let sitePath = "/" + file.substring(destination.length + 1);
		sitePath = sitePath.replace(/\/index.html?/i, "/");
		
		if (!css){
			console.log("No css in file.")
			return;
		}
		let rewritten = rewriteCSS(css, sitePath, options.baseurl);

		fs.writeFileSync(file, rewritten);
		return 0;
    }
}

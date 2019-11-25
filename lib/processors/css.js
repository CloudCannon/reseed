// Rewrite the references in css to suit the dist version.
const PluginError = require("plugin-error");
const URLRewriter = require("cssurl").URLRewriter;
const path = require("path");
const fs = require("fs-extra");

const IGNORE_URL_REGEX = /^([a-z]+\:|\/\/|\#)/;

function prepHref(href) {
	return "'" + href.replace(/'/g, "\'") + "'";
}

/**
 * 
 * @param {string} css The css code in string format
 * @param {*} sitePath 
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
    plugin: function (file, done, options = {}) {
        options = options || {};
        if (!file) {
            return done(null, file);
        }
        console.log("reading");
        let contents = fs.readFileSync(file);
        let css = contents.toString("utf-8");
        
        if (!css){
            return done(null, file);
        }
        let rewritten = rewriteCSS(css, file.sitePath, options.baseurl);
        console.log(rewritten);

        fs.writeFileSync(file, rewritten);
        return done(null, file);
    }
}

/*
module.exports = {
	rewrite: rewriteCSS,
	plugin: function (file, options) {
		options = options || {};
		return through(function (file, encoding, callback) {
			if (file.isNull()) {
				return callback(null, file);
			}

			if (file.isStream()) {
				return callback(new PluginError("cloudcannon-suite-dist-css", "Streaming not supported"));
			}

            console.log("here");
			file.sitePath = "/" + file.path.substring(file.base.length);
			file.sitePath = file.sitePath.replace(/\/index.html?/i, "/");

			let css = file.contents.toString(encoding);
			let rewritten = rewriteCSS(css, file.sitePath, options.baseurl);

			file.contents = Buffer.from(rewritten);
			this.push(file);
			callback();
		});
    }
};
*/
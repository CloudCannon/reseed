const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Maps file extensions to the content type served to the browser.
 */
const MIME_TYPES = {
	'.avif': 'image/avif',
	'.css': 'text/css; charset=utf-8',
	'.gif': 'image/gif',
	'.htm': 'text/html; charset=utf-8',
	'.html': 'text/html; charset=utf-8',
	'.ico': 'image/x-icon',
	'.jpeg': 'image/jpeg',
	'.jpg': 'image/jpeg',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.pdf': 'application/pdf',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.txt': 'text/plain; charset=utf-8',
	'.webp': 'image/webp',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.xml': 'application/xml; charset=utf-8',
};

/**
 * Responds with the given status code and a short plain-text message.
 * @param {import('node:http').ServerResponse} response The response to write to.
 * @param {number} statusCode The HTTP status code.
 * @param {string} message The message body.
 */
const respond = (response, statusCode, message) => {
	response.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
	response.end(message);
};

/**
 * Streams the file at filePath to the response.
 * @param {string} filePath The file to serve.
 * @param {import('node:http').ServerResponse} response The response to write to.
 */
const serveFile = (filePath, response) => {
	const contentType =
		MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
	response.writeHead(200, { 'Content-Type': contentType });

	const stream = fs.createReadStream(filePath);
	stream.on('error', () => {
		respond(response, 500, 'Internal Server Error');
	});
	stream.pipe(response);
};

/**
 * Resolves the request against the baseDir and serves the resulting file.
 * Directories are served by their index.html, and paths are confined to baseDir.
 * @param {string} baseDir The directory to serve files from.
 * @param {import('node:http').ServerResponse} response The response to write to.
 * @param {string} pathname The decoded request path.
 */
const servePath = (baseDir, response, pathname) => {
	// Resolve the requested path and ensure it stays within baseDir.
	const resolved = path.resolve(baseDir, `.${pathname}`);
	const relative = path.relative(baseDir, resolved);
	if (relative.startsWith('..') || path.isAbsolute(relative)) {
		respond(response, 403, 'Forbidden');
		return;
	}

	fs.stat(resolved, (err, stat) => {
		if (err || (!stat.isFile() && !stat.isDirectory())) {
			respond(response, 404, 'Not Found');
			return;
		}

		if (stat.isDirectory()) {
			const indexPath = path.join(resolved, 'index.html');
			fs.stat(indexPath, (indexError, indexStat) => {
				if (indexError || !indexStat.isFile()) {
					respond(response, 404, 'Not Found');
					return;
				}
				serveFile(indexPath, response);
			});
			return;
		}

		serveFile(resolved, response);
	});
};

/**
 * Creates a plain HTTP server that serves static files from baseDir.
 * @param {Object} options The server options.
 * @param {string} options.baseDir The directory to serve files from.
 * @param {number} options.port The port to listen on.
 * @returns {import('node:http').Server} The listening HTTP server.
 */
const createServer = ({ baseDir, port }) => {
	const server = http.createServer((request, response) => {
		if (request.method !== 'GET' && request.method !== 'HEAD') {
			respond(response, 405, 'Method Not Allowed');
			return;
		}

		const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

		let pathname;
		try {
			pathname = decodeURIComponent(requestUrl.pathname);
		} catch {
			respond(response, 400, 'Bad Request');
			return;
		}

		servePath(baseDir, response, pathname);
	});

	server.listen(port);
	return server;
};

module.exports = { createServer };

const assert = require('node:assert');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { test, suite, before, after } = require('node:test');

const { createServer } = require('../lib/server.js');

let baseDir;
let server;

const request = (pathname) =>
	new Promise((resolve, reject) => {
		const req = http.request(
			{
				hostname: 'localhost',
				port: server.address().port,
				path: pathname,
				method: 'GET',
			},
			(response) => {
				let body = '';
				response.on('data', (chunk) => {
					body += chunk;
				});
				response.on('end', () => {
					resolve({ statusCode: response.statusCode, headers: response.headers, body });
				});
			}
		);
		req.on('error', reject);
		req.end();
	});

suite('server', () => {
	before(async () => {
		baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reseed-server-'));
		fs.writeFileSync(path.join(baseDir, 'index.html'), '<h1>index</h1>');
		fs.writeFileSync(path.join(baseDir, 'style.css'), 'body{}');
		fs.mkdirSync(path.join(baseDir, 'sub'));
		fs.writeFileSync(path.join(baseDir, 'sub', 'index.html'), '<p>sub index</p>');

		server = createServer({ baseDir, port: 0 });
		await new Promise((resolve) => server.on('listening', resolve));
	});

	test('serves index.html at the root', async () => {
		const response = await request('/');
		assert.strictEqual(response.statusCode, 200);
		assert.strictEqual(response.body, '<h1>index</h1>');
	});

	test('serves a nested directory index.html', async () => {
		const response = await request('/sub/');
		assert.strictEqual(response.statusCode, 200);
		assert.strictEqual(response.body, '<p>sub index</p>');
	});

	test('serves files with the correct content type', async () => {
		const response = await request('/style.css');
		assert.strictEqual(response.statusCode, 200);
		assert.strictEqual(response.body, 'body{}');
		assert.strictEqual(response.headers['content-type'], 'text/css; charset=utf-8');
	});

	test('returns 404 for missing files', async () => {
		const response = await request('/missing.html');
		assert.strictEqual(response.statusCode, 404);
	});

	test('does not serve files outside the base directory', async () => {
		const response = await request('/..%2Fpackage.json');
		assert.strictEqual(response.statusCode, 403);
	});

	after(() => {
		if (server) server.close();
		if (baseDir) fs.rmSync(baseDir, { recursive: true, force: true });
	});
});

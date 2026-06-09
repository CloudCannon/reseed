const path = require('node:path');
const assert = require('node:assert');
const { test, suite, before, after, mock: nodeMock } = require('node:test');
const mock = require('mock-fs');
const runner = require('../lib/runner.js');

const dest = 'test/testdir';

const cloneObject = (obj) => JSON.parse(JSON.stringify(obj));

// TESTOP IS NEVER CHANGED
const testOp = {
	cwd: '/',

	paths: {
		src: 'test/src',
		dest: 'test/dest',
		baseurl: 'baseurl',
	},
	serve: {
		port: 9000,
		open: true,
		path: '/',
	},
	flags: {
		overwrite: true,
	},
};
testOp.paths.fullPathToSource = testOp.paths.src;
testOp.paths.fullPathToDest = path.resolve(testOp.paths.dest, 'baseurl');
Object.freeze(testOp);

suite('_fetchAllFiles', () => {
	before(() => {
		mock({
			testDir: {
				'image.jpg': 'imgdata',
				'style.css': 'css',
				'index.html': 'html',
				'sitemap.xml': 'sitemap',
				emptyDir: { emptierDir: {} },
				assets: { 'image2.jpg': 'imgdata' },
				css: { 'style2.css': 'css' },
				html: { 'index2.html': 'html' },
			},
		});
	});

	test('type any should retrieve all files', async () => {
		const results = await runner._fetchAllFiles('testDir');
		assert(results.css.length === 2);
		assert(results.other.length === 3);
		assert(results.html.length === 2);
	});

	suite('partitions', () => {
		const getPartitionFiles = (partition) =>
			Object.keys(partition)
				.reduce((acc, type) => acc.concat(partition[type]), [])
				.sort();

		before(async () => {
			this.defaultPartition = await runner._fetchAllFiles('testDir');
			this.partition1 = await runner._fetchAllFiles('testDir', { split: 2, partition: 1 });
			this.partition2 = await runner._fetchAllFiles('testDir', { split: 2, partition: 2 });
		});

		test('prevents invalid `split` or `partition` value', async () => {
			const partition = await runner._fetchAllFiles('testDir', { split: 0, partition: 0 });
			const files = getPartitionFiles(partition);

			assert(files.length === 7);
		});

		test('prevents undefined `split` or `partition` value', async () => {
			const partition = await runner._fetchAllFiles('testDir', {
				split: undefined,
				partition: undefined,
			});
			const files = getPartitionFiles(partition);

			assert(files.length === 7);
		});

		test('ensured `partition` is not greater than `split`', async () => {
			const partition = await runner._fetchAllFiles('testDir', { split: 1, partition: 2 });
			const files = getPartitionFiles(partition);

			assert(files.length === 7);
		});

		test('should match default behaviour', async () => {
			const defaultPartitionFiles = getPartitionFiles(this.defaultPartition).sort();
			const partition1Files = getPartitionFiles(this.partition1);
			const partition2Files = getPartitionFiles(this.partition2);

			assert.deepStrictEqual(
				defaultPartitionFiles,
				[...partition1Files, ...partition2Files].sort()
			);
		});

		test('should create partitions', async () => {
			const partition1Files = getPartitionFiles(this.partition1);
			const partition2Files = getPartitionFiles(this.partition2);

			assert(partition1Files.length === 3);
			assert(partition2Files.length === 4);
		});

		test('should not have duplicate files', async () => {
			const partition1Files = getPartitionFiles(this.partition1);
			const partition2Files = getPartitionFiles(this.partition2);
			const duplicateFiles = partition1Files.filter((value) => partition2Files.includes(value));

			assert.deepStrictEqual(duplicateFiles, []);
		});
	});

	test('dir doesnt exist should throw an error', async () => {
		const results = await runner._fetchAllFiles('test/fakeDir');
		assert(results === undefined);
	});

	after(() => {
		mock.restore();
	});
});

suite('_copyFiles', () => {
	before(() => {
		mock({
			'test/src': {
				'image.jpg': 'imgdata',
				'style.css': 'css',
				'index.html': 'html',
				emptyDir: { emptierDir: {} },
				assets: { 'image2.jpg': 'imgdata' },
				css: { 'style2.css': 'css' },
				html: { 'index2.html': 'html' },
			},
		});
	});

	test('copy files from src to dest should return the copied files', async () => {
		const fileList = [
			'test/src/image.jpg',
			'test/src/assets/image2.jpg',
			'test/src/style.css',
			'test/src/css/style2.css',
			'test/src/index.html',
			'test/src/html/index2.html',
		];
		const results = await runner._copyFiles(fileList, testOp);
		assert(results.length === 6);
	});

	test('no files to copy should return undefined', async () => {
		const results = await runner._copyFiles();
		assert(results === undefined);
	});

	after(() => {
		mock.restore();
	});
});

suite('_askYesNo', () => {
	test('Response is affirmative should return true', async () => {
		const response = await runner._askYesNo('question', 'Y');
		assert(response === true);
	});

	test('Response is negative should return false', async () => {
		const response = await runner._askYesNo('question', 'N');
		assert(response === false);
	});
});

suite('build', () => {
	let cleanMock;
	let fetchMock;
	let cloneAssetsMock;
	let rewriteCssMock;
	let rewriteHtmlMock;
	let rewriteSitemapMock;

	before(() => {
		cleanMock = nodeMock.method(runner, 'clean');
		fetchMock = nodeMock.method(runner, '_fetchAllFiles');
		cloneAssetsMock = nodeMock.method(runner, 'clone_assets');
		rewriteCssMock = nodeMock.method(runner, 'rewrite_css');
		rewriteHtmlMock = nodeMock.method(runner, 'rewrite_html');
		rewriteSitemapMock = nodeMock.method(runner, 'rewrite_sitemap');
	});

	suite('clean fails', () => {
		before(() => {
			cleanMock.mock.mockImplementation(() => 1);
		});

		test('should return with exit code 1', async () => {
			const result = await runner.build(testOp);
			assert(result === 1);
		});
	});

	suite('fetchFiles fails', () => {
		before(() => {
			cleanMock.mock.mockImplementation(() => undefined);
			fetchMock.mock.mockImplementation(() => undefined);
		});

		test('should return with exit code 1', async () => {
			const result = await runner.build(testOp);
			assert(result === 1);
		});
	});

	suite('clone_assets fails', () => {
		before(() => {
			cleanMock.mock.mockImplementation(() => undefined);
			fetchMock.mock.mockImplementation(() => []);
			cloneAssetsMock.mock.mockImplementation(() => 2);
			rewriteCssMock.mock.mockImplementation(() => 0);
			rewriteHtmlMock.mock.mockImplementation(() => 0);
		});

		test('should return with exit code 1', async () => {
			const result = await runner.build(testOp);
			assert(result === 2);
		});
	});

	suite('rewrite_css fails', () => {
		before(() => {
			cleanMock.mock.mockImplementation(() => undefined);
			fetchMock.mock.mockImplementation(() => []);
			cloneAssetsMock.mock.mockImplementation(() => []);
			rewriteCssMock.mock.mockImplementation(() => 2);
			rewriteHtmlMock.mock.mockImplementation(() => 0);
		});
		test('should return with exit code 2', async () => {
			const result = await runner.build(testOp);
			assert(result === 2);
		});
	});

	suite('rewrite_html fails', () => {
		before(() => {
			cleanMock.mock.mockImplementation(() => undefined);
			fetchMock.mock.mockImplementation(() => []);
			cloneAssetsMock.mock.mockImplementation(() => []);
			rewriteCssMock.mock.mockImplementation(() => 0);
			rewriteHtmlMock.mock.mockImplementation(() => 2);
		});
		test('should return with exit code 2', async () => {
			const result = await runner.build(testOp);
			assert(result === 2);
		});
	});

	suite('rewrite_sitemap fails', () => {
		before(() => {
			cleanMock.mock.mockImplementation(() => undefined);
			fetchMock.mock.mockImplementation(() => []);
			cloneAssetsMock.mock.mockImplementation(() => []);
			rewriteCssMock.mock.mockImplementation(() => 0);
			rewriteHtmlMock.mock.mockImplementation(() => 0);
			rewriteSitemapMock.mock.mockImplementation(() => 2);
		});
		test('should return with exit code 2', async () => {
			const result = await runner.build(testOp);
			assert(result === 2);
		});
	});

	suite('everything works', () => {
		before(() => {
			cleanMock.mock.mockImplementation(() => undefined);
			fetchMock.mock.mockImplementation(() => []);
			cloneAssetsMock.mock.mockImplementation(() => []);
			rewriteCssMock.mock.mockImplementation(() => 0);
			rewriteHtmlMock.mock.mockImplementation(() => 0);
			rewriteSitemapMock.mock.mockImplementation(() => 0);
		});
		test('should return with exit code 0', async () => {
			const result = await runner.build(testOp);
			assert(result === 0);
		});
	});

	after(() => {
		cleanMock.mock.restore();
		fetchMock.mock.restore();
		cloneAssetsMock.mock.restore();
		rewriteCssMock.mock.restore();
		rewriteHtmlMock.mock.restore();
		rewriteSitemapMock.mock.restore();
	});
});

suite('clean', async () => {
	let yesNoMock;
	before(() => {
		yesNoMock = nodeMock.method(runner, '_askYesNo');
		mock({ [dest]: {} });
	});

	suite('User answers no to overwrite', () => {
		before(() => {
			yesNoMock.mock.mockImplementation(() => false);
		});

		test('should return exit code 1', async () => {
			const res = await runner.clean({ paths: { dest: dest }, flags: {} });
			assert(res === 1);
		});

		after(() => {
			yesNoMock.mock.restore();
		});
	});

	test('Removing a file should remove the directory', async () => {
		const options = cloneObject(testOp);
		options.paths.dest = dest;
		const res = await runner.clean(options);
		assert(res === undefined);
	});

	test('invalid directory name should return without an error', async () => {
		const options = cloneObject(testOp);
		options.paths.dest = 'thisdoesntexist';
		const res = await runner.clean(options);
		assert(res === undefined);
	});

	after(() => {
		mock.restore();
	});
});

suite('clone-assets', () => {
	before(() => {
		mock({
			'test/src': {
				'image.jpg': 'imgdata',
				assets: {
					'image2.jpg': 'imgdata',
				},
			},
		});
	});

	test('Cloning from a valid directory should return exit code 0', async () => {
		const result = await runner.clone_assets(testOp);
		assert(result === 0);
	});

	test('Cloning from invalid directory should return undefined', async () => {
		const options = cloneObject(testOp);
		options.paths.fullPathToSource = 'thisdoesntexist';
		const results = await runner.clone_assets(options);
		assert(results === 1);
	});

	after(() => {
		mock.restore();
	});
});

suite('buildAndServe', () => {
	suite('build fails', () => {
		let buildMock;

		before(() => {
			buildMock = nodeMock.method(runner, 'build', () => 1);
		});

		test('should return with exit code 1', async () => {
			const results = await runner.buildAndServe();
			assert(results === 1);
		});

		after(() => {
			buildMock.mock.restore();
		});
	});

	suite('build succeeds', () => {
		let buildMock;
		let serveMock;
		let watchMock;

		before(() => {
			buildMock = nodeMock.method(runner, 'build', () => undefined);
			serveMock = nodeMock.method(runner, 'serve', () => undefined);
			watchMock = nodeMock.method(runner, 'watch', () => undefined);
		});

		test('should return with exit code 0', async () => {
			const results = await runner.buildAndServe();
			assert(results === 0);
		});

		after(() => {
			buildMock.mock.restore();
			serveMock.mock.restore();
			watchMock.mock.restore();
		});
	});
});

suite('rewrite-css', () => {
	before(() => {
		mock({
			'test/src': {
				'style.css': 'css',
				css: {
					'style2.css': 'css',
				},
			},
		});
	});

	test('Cloning from a valid directory should return the cloned files', async () => {
		const results = await runner.rewrite_css(testOp);
		assert(results === 0);
	});

	test('Cloning from invalid directory should return undefined', async () => {
		const options = cloneObject(testOp);
		options.paths.fullPathToSource = 'thisdoesntexist';
		const results = await runner.rewrite_css(options);
		assert(results === 1);
	});

	test('trying to copy files that dont exist should return 1', async () => {
		const options = cloneObject(testOp);
		options.paths.fullPathToSource = 'fake';
		const results = await runner.rewrite_css(options);
		assert(results === 1);
	});

	after(() => {
		mock.restore();
	});
});

suite('rewrite_html', () => {
	suite('No files to copy', () => {
		let fetchFileMock;
		before(() => {
			fetchFileMock = nodeMock.method(runner, '_fetchAllFiles', () => undefined);
		});

		test('should return with exit code 1', async () => {
			const result = await runner.rewrite_html(testOp);
			assert(result === 1);
		});

		after(() => {
			fetchFileMock.mock.restore();
		});
	});

	suite('copyFiles errored', () => {
		let copyFilesMock;
		before(() => {
			copyFilesMock = nodeMock.method(runner, '_copyFiles', () => undefined);
		});
		test('should return with exit code 4', async () => {
			const result = await runner.rewrite_html(testOp, ['file1', 'file2']);
			assert(result === 4);
		});
		after(() => {
			copyFilesMock.mock.restore();
		});
	});

	suite('trying to copy files that dont exist', () => {
		test('should return 1', async () => {
			const options = cloneObject(testOp);
			options.paths.fullPathToSource = 'fake';
			const results = await runner.rewrite_html(options);
			assert(results === 1);
		});
	});

	suite('Cloning from a valid directory', () => {
		before(() => {
			mock({
				'test/src': {
					'index.html': 'html',
					html: {
						'index2.html': 'html',
					},
				},
			});
		});

		test('should return the cloned files', async () => {
			const results = await runner.rewrite_html(testOp);
			assert(results === 0);
		});

		after(() => {
			mock.restore();
		});
	});
});

suite('rewrite_sitemap()', () => {
	test('no sitemap should return error exit code (1)', async () => {
		const results = await runner.rewrite_sitemap(testOp);
		assert(results === 1);
	});

	suite('Uses sitemap index', () => {
		before(() => {
			mock({
				'test/src': {
					'sitemapindex.xml': `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
					<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

					<sitemap>
						<loc>http://example.org/sitemaps/pagelist.xml</loc>
						<lastmod>2016-11-11T00:00:00+13:00</lastmod>
					</sitemap>

					<sitemap>
						<loc>http://example.org/sitemaps/morepages.xml</loc>
						<lastmod>2016-11-11T00:00:00+13:00</lastmod>
					</sitemap>
					<sitemap>
						<loc>dudlink/map.xml</loc>
						<lastmod>2016-11-11T00:00:00+13:00</lastmod>
					</sitemap>
					</sitemapindex>`,
					sitemaps: {
						'pagelist.xml': 'xml',
						'morepages.xml': 'xml',
					},
				},
			});
		});

		test('should return exit code 0', async () => {
			const options = cloneObject(testOp);
			options.paths.sitemap = 'sitemapindex.xml';
			const results = await runner.rewrite_sitemap(options);
			assert(results === 0);
		});

		after(() => {
			mock.restore();
		});
	});
});

suite('rewrite_rss()', () => {
	test('no rss feed should return error exit code (1)', async () => {
		const results = await runner.rewrite_rss(testOp);
		assert(results === 1);
	});

	suite('specified file is not XML', () => {
		before(() => {
			mock({
				'test/src': {
					'index.txt': '<?xml version="1.0" encoding="utf-8" standalone="yes"?>',
				},
			});
		});

		test('should fail but continue running (exit code 0)', async () => {
			const options = cloneObject(testOp);
			options.paths.rss = 'index.txt';
			const results = await runner.rewrite_rss(options);
			assert(results === 0);
		});

		after(() => {
			mock.restore();
		});
	});

	suite('Uses rss files', () => {
		before(() => {
			mock({
				'test/src': {
					'index.xml': `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
					<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
					</rss>`,
					blog: {
						'index.xml': `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
						<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
						</rss>`,
					},
				},
			});
		});

		test('should return exit code 0', async () => {
			const options = cloneObject(testOp);
			options.paths.rss = '**/index.xml';
			const results = await runner.rewrite_rss(options);
			assert(results === 0);
		});

		after(() => {
			mock.restore();
		});
	});
});

suite('watch', () => {
	let watchMock;

	before(() => {
		watchMock = nodeMock.method(runner, 'watch', () => 0);
	});

	after(() => {
		watchMock.mock.restore();
	});

	test('nice is cool', () => {
		const result = runner.watch(testOp);
		assert(result === 0);
	});
});

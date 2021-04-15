/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-underscore-dangle */
const path = require('path');
const { expect } = require('chai');
const mock = require('mock-fs');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const runner = require('../lib/runner.js');

const dest = 'test/testdir';

const cloneObject = (obj) => JSON.parse(JSON.stringify(obj));

// TESTOP IS NEVER CHANGED
const testOp = {
	cwd: '/',

	paths: {
		src: 'test/src',
		dest: 'test/dest',
		baseurl: 'baseurl'
	},
	serve: {
		port: 9000,
		open: true,
		path: '/'
	},
	flags: {
		overwrite: true
	}
};
testOp.paths.fullPathToSource = testOp.paths.src;
testOp.paths.fullPathToDest = path.resolve(testOp.paths.dest, 'baseurl');
Object.freeze(testOp);

describe('_fetchAllFiles', function () {
	before(function () {
		mock({
			testDir: {
				'image.jpg': 'imgdata',
				'style.css': 'css',
				'index.html': 'html',
				'sitemap.xml': 'sitemap',
				emptyDir: { emptierDir: {} },
				assets: {
					'image2.jpg': 'imgdata'
				},
				css: {
					'style2.css': 'css'
				},
				html: {
					'index2.html': 'html'
				}
			}
		});
	});

	context('type = any', function () {
		it('should retrieve all files', async function () {
			const results = await runner._fetchAllFiles('testDir');
			expect(results.css.length).to.equal(2);
			expect(results.other.length).to.equal(3);
			expect(results.html.length).to.equal(2);
		});
	});

	context('partitions', function () {
		const getPartitionFiles = (partition) => (
			Object.keys(partition).reduce((acc, type) => [...acc, ...partition[type]], []).sort()
		);

		before(async function () {
			this.defaultPartition = await runner._fetchAllFiles('testDir');
			this.partition1 = await runner._fetchAllFiles('testDir', { split: 2, partition: 1 });
			this.partition2 = await runner._fetchAllFiles('testDir', { split: 2, partition: 2 });
		});

		it('prevents invalid `split` or `partition` value', async function () {
			const partition = await runner._fetchAllFiles('testDir', { split: 0, partition: 0 });
			const files = getPartitionFiles(partition);

			expect(files.length).to.equal(7);
		});

		it('prevents undefined `split` or `partition` value', async function () {
			const partition = await runner._fetchAllFiles('testDir', { split: undefined, partition: undefined });
			const files = getPartitionFiles(partition);

			expect(files.length).to.equal(7);
		});

		it('ensured `partition` is not greater than `split`', async function () {
			const partition = await runner._fetchAllFiles('testDir', { split: 1, partition: 2 });
			const files = getPartitionFiles(partition);

			expect(files.length).to.equal(7);
		});

		it('should match default behaviour', async function () {
			const defaultPartitionFiles = getPartitionFiles(this.defaultPartition);
			const partition1Files = getPartitionFiles(this.partition1);
			const partition2Files = getPartitionFiles(this.partition2);

			expect(defaultPartitionFiles).to.eql([...partition1Files, ...partition2Files]);
		});

		it('should create partitions', async function () {
			const partition1Files = getPartitionFiles(this.partition1);
			const partition2Files = getPartitionFiles(this.partition2);

			expect(partition1Files.length).to.equal(3);
			expect(partition2Files.length).to.equal(4);
		});

		it('should not have duplicate files', async function () {
			const partition1Files = getPartitionFiles(this.partition1);
			const partition2Files = getPartitionFiles(this.partition2);
			const duplicateFiles = partition1Files.filter((value) => partition2Files.includes(value));

			expect(duplicateFiles).to.eql([]);
		});
	});

	context('dir doesnt exist', function () {
		it('should throw an error', async function () {
			const results = await runner._fetchAllFiles('test/fakeDir');
			expect(results).to.eq(undefined);
		});
	});

	after(function () {
		mock.restore();
	});
});

describe('_copyFiles', function () {
	before(function () {
		mock({
			'test/src': {
				'image.jpg': 'imgdata',
				'style.css': 'css',
				'index.html': 'html',
				emptyDir: { emptierDir: {} },
				assets: {
					'image2.jpg': 'imgdata'
				},
				css: {
					'style2.css': 'css'
				},
				html: {
					'index2.html': 'html'
				}
			}
		});
	});

	context('copy files from src to dest', function () {
		it('should return the copied files', async function () {
			const fileList = ['test/src/image.jpg', 'test/src/assets/image2.jpg', 'test/src/style.css',
				'test/src/css/style2.css', 'test/src/index.html', 'test/src/html/index2.html'];
			const results = await runner._copyFiles(fileList, testOp);
			expect(results.length).to.equal(6);
		});
	});

	context('no files to copy', function () {
		it('should return undefined', async function () {
			const results = await runner._copyFiles();
			expect(results).to.equal(undefined);
		});
	});

	after(function () {
		mock.restore();
	});
});

describe('_askYesNo', function () {
	context('Response is affirmative', function () {
		it('should return true', async function () {
			const response = await runner._askYesNo('question', 'Y');
			expect(response).to.equal(true);
		});
	});

	context('Response is negative', function () {
		it('should return false', async function () {
			const response = await runner._askYesNo('question', 'N');
			expect(response).to.equal(false);
		});
	});
});

describe('build', function () {
	let cleanStub;
	let fetchStub;
	let cloneAssetsStub;
	let rewriteCssStub;
	let rewriteHtmlStub;
	let rewriteSitemapStub;

	before(function () {
		cleanStub = sinon.stub(runner, 'clean');
		fetchStub = sinon.stub(runner, '_fetchAllFiles');
		cloneAssetsStub = sinon.stub(runner, 'clone_assets');
		rewriteCssStub = sinon.stub(runner, 'rewrite_css');
		rewriteHtmlStub = sinon.stub(runner, 'rewrite_html');
		rewriteSitemapStub = sinon.stub(runner, 'rewrite_sitemap');
	});

	context('clean fails', function () {
		before(function () {
			cleanStub.returns(1);
		});

		it('should return with exit code 1', async function () {
			const result = await runner.build(testOp);
			expect(result).to.equal(1);
		});
	});

	context('fetchFiles fails', function () {
		before(function () {
			cleanStub.returns([]);
			fetchStub.returns();
		});

		it('should return with exit code 1', async function () {
			const result = await runner.build(testOp);
			expect(result).to.equal(1);
		});
	});

	context('clone_assets fails', function () {
		before(function () {
			cleanStub.returns([]);
			fetchStub.returns([]);
			cloneAssetsStub.returns();
			rewriteCssStub.returns(0);
			rewriteHtmlStub.returns(0);
		});

		it('should return with exit code 1', async function () {
			const result = await runner.build(testOp);
			expect(result).to.equal(1);
		});
	});

	context('rewrite_css fails', function () {
		before(function () {
			cleanStub.returns([]);
			fetchStub.returns([]);
			cloneAssetsStub.returns([]);
			rewriteCssStub.returns(1);
			rewriteHtmlStub.returns(0);
		});
		it('should return with exit code 1', async function () {
			const result = await runner.build(testOp);
			expect(result).to.equal(1);
		});
	});

	context('rewrite_html fails', function () {
		before(function () {
			cleanStub.returns([]);
			fetchStub.returns([]);
			cloneAssetsStub.returns([]);
			rewriteCssStub.returns(0);
			rewriteHtmlStub.returns(1);
		});
		it('should return with exit code 1', async function () {
			const result = await runner.build(testOp);
			expect(result).to.equal(1);
		});
	});

	context('rewrite_sitemap fails', function () {
		before(function () {
			cleanStub.returns([]);
			fetchStub.returns([]);
			cloneAssetsStub.returns([]);
			rewriteCssStub.returns(0);
			rewriteHtmlStub.returns(0);
			rewriteSitemapStub.returns(1);
		});
		it('should return with exit code 1', async function () {
			const result = await runner.build(testOp);
			expect(result).to.equal(1);
		});
	});

	context('everything works', function () {
		before(function () {
			cleanStub.returns([]);
			fetchStub.returns([]);
			cloneAssetsStub.returns([]);
			rewriteCssStub.returns(0);
			rewriteHtmlStub.returns(0);
			rewriteSitemapStub.returns(0);
		});
		it('should return with exit code 0', async function () {
			const result = await runner.build(testOp);
			expect(result).to.equal(0);
		});
	});

	after(function () {
		cleanStub.restore();
		fetchStub.restore();
		cloneAssetsStub.restore();
		rewriteCssStub.restore();
		rewriteHtmlStub.restore();
		rewriteSitemapStub.restore();
	});
});

describe('clean', async function () {
	let yesNoStub;
	before(function () {
		yesNoStub = sinon.stub(runner, '_askYesNo');
		mock({ [dest]: {} });
	});

	context('User answers no to overwrite', function () {
		before(function () {
			yesNoStub.returns(false);
		});

		it('should return exit code 1', async function () {
			const res = await runner.clean({ paths: { dest: dest }, flags: {} });
			expect(res).to.equal(1);
		});

		after(function () {
			yesNoStub.restore();
		});
	});

	context('Removing a file', function () {
		it('should remove the directory', async function () {
			const options = cloneObject(testOp);
			options.paths.dest = dest;
			const res = await runner.clean(options);
			expect(res).to.eql([path.resolve(options.paths.dest)]);
		});
	});

	context('invalid directory name', function () {
		const options = cloneObject(testOp);
		options.paths.dest = 'thisdoesntexist';
		it('should return an empty array', async function () {
			const res = await runner.clean(options);
			expect(res).to.eql([]);
		});
	});

	after(function () {
		mock.restore();
	});
});

describe('clone-assets', function () {
	before(function () {
		mock({
			'test/src': {
				'image.jpg': 'imgdata',
				assets: {
					'image2.jpg': 'imgdata'
				}
			}
		});
	});

	context('Cloning from a valid directory', function () {
		it('should return the cloned files', async function () {
			const results = await runner.clone_assets(testOp);
			expect(results.length).to.equal(2);
		});
	});

	context('Cloning from invalid directory', function () {
		it('should return undefined', async function () {
			const options = cloneObject(testOp);
			options.paths.fullPathToSource = 'thisdoesntexist';
			const results = await runner.clone_assets(options);
			expect(results).to.equal(1);
		});
	});

	after(function () {
		mock.restore();
	});
});

describe('buildAndServe', function () {
	let buildStub;
	let serveStub;
	let watchStub;

	before(function () {
		buildStub = sinon.stub(runner, 'build');
		serveStub = sinon.stub(runner, 'serve');
		watchStub = sinon.stub(runner, 'watch');
	});

	context('build fails', function () {
		before(function () {
			buildStub.returns(1);
		});

		it('should return with exit code 1', async function () {
			const results = await runner.buildAndServe();
			expect(results).to.equal(1);
		});

		after(function () {
			buildStub.reset();
		});
	});

	context('build succeeds', function () {
		before(function () {
			serveStub.returns();
			watchStub.returns();
		});

		it('should return with exit code 0', async function () {
			const results = await runner.buildAndServe();
			expect(results).to.equal(0);
		});
	});

	after(function () {
		buildStub.restore();
		serveStub.restore();
		watchStub.restore();
	});
});

describe('rewrite-css', function () {
	before(function () {
		mock({
			'test/src': {
				'style.css': 'css',
				css: {
					'style2.css': 'css'
				}
			}
		});
	});

	context('Cloning from a valid directory', function () {
		it('should return the cloned files', async function () {
			const results = await runner.rewrite_css(testOp);
			expect(results).to.equal(0);
		});
	});

	context('Cloning from invalid directory', function () {
		it('should return undefined', async function () {
			const options = cloneObject(testOp);
			options.paths.fullPathToSource = 'thisdoesntexist';
			const results = await runner.rewrite_css(options);
			expect(results).to.equal(1);
		});
	});

	context('trying to copy files that dont exist', function () {
		it('should return 1', async function () {
			const options = cloneObject(testOp);
			options.paths.fullPathToSource = 'fake';
			const results = await runner.rewrite_css(options);
			expect(results).to.equal(1);
		});
	});

	after(function () {
		mock.restore();
	});
});

describe('rewrite_html', function () {
	let fetchFileStub;
	let copyFilesStub;

	before(function () {
		fetchFileStub = sinon.stub(runner, '_fetchAllFiles');
		copyFilesStub = sinon.stub(runner, '_copyFiles');
	});

	context('No files to copy', function () {
		context('_fetchAllFiles fails', function () {
			before(function () {
				fetchFileStub.returns();
			});
			it('should return with exit code 1', async function () {
				const result = await runner.rewrite_html(testOp);
				expect(result).to.equal(1);
			});
		});
		context('fetchFiles succeeds', function () {
			before(function () {
				fetchFileStub.callThrough();
			});
		});

		after(function () {
			fetchFileStub.restore();
		});
	});

	context('copiedFiles errored', function () {
		before(function () {
			copyFilesStub.returns();
		});
		it('should return with exit code 1', async function () {
			const result = await runner.rewrite_html(testOp, ['file1', 'file2']);
			expect(result).to.equal(1);
		});
		after(function () {
			copyFilesStub.restore();
		});
	});

	context('trying to copy files that dont exist', function () {
		it('should return 1', async function () {
			const options = cloneObject(testOp);
			options.paths.fullPathToSource = 'fake';
			const results = await runner.rewrite_html(options);
			expect(results).to.equal(1);
		});
	});

	context('Cloning from a valid directory', function () {
		before(function () {
			mock({
				'test/src': {
					'index.html': 'html',
					html: {
						'index2.html': 'html'
					}
				}
			});
		});

		it('should return the cloned files', async function () {
			const results = await runner.rewrite_html(testOp);
			expect(results).to.equal(0);
		});

		after(function () {
			mock.restore();
		});
	});
});

describe('rewrite_sitemap()', function () {
	context('no sitemap', function () {
		it('should return error exit code (1)', async function () {
			const results = await runner.rewrite_sitemap(testOp);
			expect(results).to.equal(1);
		});
	});

	context('Uses sitemap index', function () {
		before(function () {
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
						'morepages.xml': 'xml'
					}
				}
			});
		});

		it('should return exit code 0', async function () {
			const options = cloneObject(testOp);
			options.paths.sitemap = 'sitemapindex.xml';
			const results = await runner.rewrite_sitemap(options);
			expect(results).to.equal(0);
		});

		after(function () {
			mock.restore();
		});
	});
});

describe('serve', function () {

});

describe('watch', function () {
	let runnerWatch;
	before(function () {
		runnerWatch = proxyquire('../lib/runner', {
			chokidar: {
				watch: sinon.stub().returns({
					on: sinon.stub().yields()
				})
			}
		});
	});

	context('nice', function () {
		it('is cool', function () {
			const result = runnerWatch.watch(testOp);
			expect(result).to.equal(0);
		});
	});
});

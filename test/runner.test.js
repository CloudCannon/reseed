const path = require("path");
const assert = require("node:assert");
const { test, suite, before, after } = require("node:test");
const mock = require("mock-fs");
const sinon = require("sinon");
const proxyquire = require("proxyquire");
const runner = require("../lib/runner.js");

const dest = "test/testdir";

const cloneObject = (obj) => JSON.parse(JSON.stringify(obj));

// TESTOP IS NEVER CHANGED
const testOp = {
	cwd: "/",

	paths: {
		src: "test/src",
		dest: "test/dest",
		baseurl: "baseurl",
	},
	serve: {
		port: 9000,
		open: true,
		path: "/",
	},
	flags: {
		overwrite: true,
	},
};
testOp.paths.fullPathToSource = testOp.paths.src;
testOp.paths.fullPathToDest = path.resolve(testOp.paths.dest, "baseurl");
Object.freeze(testOp);

suite("_fetchAllFiles", () => {
	before(() => {
		mock({
			testDir: {
				"image.jpg": "imgdata",
				"style.css": "css",
				"index.html": "html",
				"sitemap.xml": "sitemap",
				emptyDir: { emptierDir: {} },
				assets: { "image2.jpg": "imgdata" },
				css: { "style2.css": "css" },
				html: { "index2.html": "html" },
			},
		});
	});

	test("type any should retrieve all files", async () => {
		const results = await runner._fetchAllFiles("testDir");
		assert(results.css.length === 2);
		assert(results.other.length === 3);
		assert(results.html.length === 2);
	});

	suite("partitions", () => {
		const getPartitionFiles = (partition) =>
			Object.keys(partition)
				.reduce((acc, type) => [...acc, ...partition[type]], [])
				.sort();

		before(async () => {
			this.defaultPartition = await runner._fetchAllFiles("testDir");
			this.partition1 = await runner._fetchAllFiles("testDir", { split: 2, partition: 1 });
			this.partition2 = await runner._fetchAllFiles("testDir", { split: 2, partition: 2 });
		});

		test("prevents invalid `split` or `partition` value", async () => {
			const partition = await runner._fetchAllFiles("testDir", { split: 0, partition: 0 });
			const files = getPartitionFiles(partition);

			assert(files.length === 7);
		});

		test("prevents undefined `split` or `partition` value", async () => {
			const partition = await runner._fetchAllFiles("testDir", {
				split: undefined,
				partition: undefined,
			});
			const files = getPartitionFiles(partition);

			assert(files.length === 7);
		});

		test("ensured `partition` is not greater than `split`", async () => {
			const partition = await runner._fetchAllFiles("testDir", { split: 1, partition: 2 });
			const files = getPartitionFiles(partition);

			assert(files.length === 7);
		});

		test("should match default behaviour", async () => {
			const defaultPartitionFiles = getPartitionFiles(this.defaultPartition).sort();
			const partition1Files = getPartitionFiles(this.partition1);
			const partition2Files = getPartitionFiles(this.partition2);

			assert.deepStrictEqual(
				defaultPartitionFiles,
				[...partition1Files, ...partition2Files].sort(),
			);
		});

		test("should create partitions", async () => {
			const partition1Files = getPartitionFiles(this.partition1);
			const partition2Files = getPartitionFiles(this.partition2);

			assert(partition1Files.length === 3);
			assert(partition2Files.length === 4);
		});

		test("should not have duplicate files", async () => {
			const partition1Files = getPartitionFiles(this.partition1);
			const partition2Files = getPartitionFiles(this.partition2);
			const duplicateFiles = partition1Files.filter((value) => partition2Files.includes(value));

			assert.deepStrictEqual(duplicateFiles, []);
		});
	});

	test("dir doesnt exist should throw an error", async () => {
		const results = await runner._fetchAllFiles("test/fakeDir");
		assert(results === undefined);
	});

	after(() => {
		mock.restore();
	});
});

suite("_copyFiles", () => {
	before(() => {
		mock({
			"test/src": {
				"image.jpg": "imgdata",
				"style.css": "css",
				"index.html": "html",
				emptyDir: { emptierDir: {} },
				assets: { "image2.jpg": "imgdata" },
				css: { "style2.css": "css" },
				html: { "index2.html": "html" },
			},
		});
	});

	test("copy files from src to dest should return the copied files", async () => {
		const fileList = [
			"test/src/image.jpg",
			"test/src/assets/image2.jpg",
			"test/src/style.css",
			"test/src/css/style2.css",
			"test/src/index.html",
			"test/src/html/index2.html",
		];
		const results = await runner._copyFiles(fileList, testOp);
		assert(results.length === 6);
	});

	test("no files to copy should return undefined", async () => {
		const results = await runner._copyFiles();
		assert(results === undefined);
	});

	after(() => {
		mock.restore();
	});
});

suite("_askYesNo", () => {
	test("Response is affirmative should return true", async () => {
		const response = await runner._askYesNo("question", "Y");
		assert(response === true);
	});

	test("Response is negative should return false", async () => {
		const response = await runner._askYesNo("question", "N");
		assert(response === false);
	});
});

suite("build", () => {
	let cleanStub;
	let fetchStub;
	let cloneAssetsStub;
	let rewriteCssStub;
	let rewriteHtmlStub;
	let rewriteSitemapStub;

	before(() => {
		cleanStub = sinon.stub(runner, "clean");
		fetchStub = sinon.stub(runner, "_fetchAllFiles");
		cloneAssetsStub = sinon.stub(runner, "clone_assets");
		rewriteCssStub = sinon.stub(runner, "rewrite_css");
		rewriteHtmlStub = sinon.stub(runner, "rewrite_html");
		rewriteSitemapStub = sinon.stub(runner, "rewrite_sitemap");
	});

	suite("clean fails", () => {
		before(() => {
			cleanStub.returns(1);
		});

		test("should return with exit code 1", async () => {
			const result = await runner.build(testOp);
			assert(result === 1);
		});
	});

	suite("fetchFiles fails", () => {
		before(() => {
			cleanStub.returns(undefined);
			fetchStub.returns();
		});

		test("should return with exit code 1", async () => {
			const result = await runner.build(testOp);
			assert(result === 1);
		});
	});

	suite("clone_assets fails", () => {
		before(() => {
			cleanStub.returns(undefined);
			fetchStub.returns([]);
			cloneAssetsStub.returns(2);
			rewriteCssStub.returns(0);
			rewriteHtmlStub.returns(0);
		});

		test("should return with exit code 1", async () => {
			const result = await runner.build(testOp);
			assert(result === 2);
		});
	});

	suite("rewrite_css fails", () => {
		before(() => {
			cleanStub.returns(undefined);
			fetchStub.returns([]);
			cloneAssetsStub.returns([]);
			rewriteCssStub.returns(2);
			rewriteHtmlStub.returns(0);
		});
		test("should return with exit code 2", async () => {
			const result = await runner.build(testOp);
			assert(result === 2);
		});
	});

	suite("rewrite_html fails", () => {
		before(() => {
			cleanStub.returns(undefined);
			fetchStub.returns([]);
			cloneAssetsStub.returns([]);
			rewriteCssStub.returns(0);
			rewriteHtmlStub.returns(2);
		});
		test("should return with exit code 2", async () => {
			const result = await runner.build(testOp);
			assert(result === 2);
		});
	});

	suite("rewrite_sitemap fails", () => {
		before(() => {
			cleanStub.returns(undefined);
			fetchStub.returns([]);
			cloneAssetsStub.returns([]);
			rewriteCssStub.returns(0);
			rewriteHtmlStub.returns(0);
			rewriteSitemapStub.returns(2);
		});
		test("should return with exit code 2", async () => {
			const result = await runner.build(testOp);
			assert(result === 2);
		});
	});

	suite("everything works", () => {
		before(() => {
			cleanStub.returns(undefined);
			fetchStub.returns([]);
			cloneAssetsStub.returns([]);
			rewriteCssStub.returns(0);
			rewriteHtmlStub.returns(0);
			rewriteSitemapStub.returns(0);
		});
		test("should return with exit code 0", async () => {
			const result = await runner.build(testOp);
			assert(result === 0);
		});
	});

	after(() => {
		cleanStub.restore();
		fetchStub.restore();
		cloneAssetsStub.restore();
		rewriteCssStub.restore();
		rewriteHtmlStub.restore();
		rewriteSitemapStub.restore();
	});
});

suite("clean", async () => {
	let yesNoStub;
	before(() => {
		yesNoStub = sinon.stub(runner, "_askYesNo");
		mock({ [dest]: {} });
	});

	suite("User answers no to overwrite", () => {
		before(() => {
			yesNoStub.returns(false);
		});

		test("should return exit code 1", async () => {
			const res = await runner.clean({ paths: { dest: dest }, flags: {} });
			assert(res === 1);
		});

		after(() => {
			yesNoStub.restore();
		});
	});

	test("Removing a file should remove the directory", async () => {
		const options = cloneObject(testOp);
		options.paths.dest = dest;
		const res = await runner.clean(options);
		assert(res === undefined);
	});

	test("invalid directory name should return without an error", async () => {
		const options = cloneObject(testOp);
		options.paths.dest = "thisdoesntexist";
		const res = await runner.clean(options);
		assert(res === undefined);
	});

	after(() => {
		mock.restore();
	});
});

suite("clone-assets", () => {
	before(() => {
		mock({
			"test/src": {
				"image.jpg": "imgdata",
				assets: {
					"image2.jpg": "imgdata",
				},
			},
		});
	});

	test("Cloning from a valid directory should return exit code 0", async () => {
		const result = await runner.clone_assets(testOp);
		assert(result === 0);
	});

	test("Cloning from invalid directory should return undefined", async () => {
		const options = cloneObject(testOp);
		options.paths.fullPathToSource = "thisdoesntexist";
		const results = await runner.clone_assets(options);
		assert(results === 1);
	});

	after(() => {
		mock.restore();
	});
});

suite("buildAndServe", () => {
	let buildStub;
	let serveStub;
	let watchStub;

	before(() => {
		buildStub = sinon.stub(runner, "build");
		serveStub = sinon.stub(runner, "serve");
		watchStub = sinon.stub(runner, "watch");
	});

	suite("build fails", () => {
		before(() => {
			buildStub.returns(1);
		});

		test("should return with exit code 1", async () => {
			const results = await runner.buildAndServe();
			assert(results === 1);
		});

		after(() => {
			buildStub.reset();
		});
	});

	suite("build succeeds", () => {
		before(() => {
			serveStub.returns();
			watchStub.returns();
		});

		test("should return with exit code 0", async () => {
			const results = await runner.buildAndServe();
			assert(results === 0);
		});
	});

	after(() => {
		buildStub.restore();
		serveStub.restore();
		watchStub.restore();
	});
});

suite("rewrite-css", () => {
	before(() => {
		mock({
			"test/src": {
				"style.css": "css",
				css: {
					"style2.css": "css",
				},
			},
		});
	});

	test("Cloning from a valid directory should return the cloned files", async () => {
		const results = await runner.rewrite_css(testOp);
		assert(results === 0);
	});

	test("Cloning from invalid directory should return undefined", async () => {
		const options = cloneObject(testOp);
		options.paths.fullPathToSource = "thisdoesntexist";
		const results = await runner.rewrite_css(options);
		assert(results === 1);
	});

	test("trying to copy files that dont exist should return 1", async () => {
		const options = cloneObject(testOp);
		options.paths.fullPathToSource = "fake";
		const results = await runner.rewrite_css(options);
		assert(results === 1);
	});

	after(() => {
		mock.restore();
	});
});

suite("rewrite_html", () => {
	let fetchFileStub;
	let copyFilesStub;

	before(() => {
		fetchFileStub = sinon.stub(runner, "_fetchAllFiles");
		copyFilesStub = sinon.stub(runner, "_copyFiles");
	});

	suite("No files to copy", () => {
		suite("_fetchAllFiles fails", () => {
			before(() => {
				fetchFileStub.returns();
			});
			test("should return with exit code 1", async () => {
				const result = await runner.rewrite_html(testOp);
				assert(result === 1);
			});
		});
		suite("fetchFiles succeeds", () => {
			before(() => {
				fetchFileStub.callThrough();
			});
		});

		after(() => {
			fetchFileStub.restore();
		});
	});

	suite("copyFiles errored", () => {
		before(() => {
			copyFilesStub.returns();
		});
		test("should return with exit code 4", async () => {
			const result = await runner.rewrite_html(testOp, ["file1", "file2"]);
			assert(result === 4);
		});
		after(() => {
			copyFilesStub.restore();
		});
	});

	suite("trying to copy files that dont exist", () => {
		test("should return 1", async () => {
			const options = cloneObject(testOp);
			options.paths.fullPathToSource = "fake";
			const results = await runner.rewrite_html(options);
			assert(results === 1);
		});
	});

	suite("Cloning from a valid directory", () => {
		before(() => {
			mock({
				"test/src": {
					"index.html": "html",
					html: {
						"index2.html": "html",
					},
				},
			});
		});

		test("should return the cloned files", async () => {
			const results = await runner.rewrite_html(testOp);
			assert(results === 0);
		});

		after(() => {
			mock.restore();
		});
	});
});

suite("rewrite_sitemap()", () => {
	test("no sitemap should return error exit code (1)", async () => {
		const results = await runner.rewrite_sitemap(testOp);
		assert(results === 1);
	});

	suite("Uses sitemap index", () => {
		before(() => {
			mock({
				"test/src": {
					"sitemapindex.xml": `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
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
						"pagelist.xml": "xml",
						"morepages.xml": "xml",
					},
				},
			});
		});

		test("should return exit code 0", async () => {
			const options = cloneObject(testOp);
			options.paths.sitemap = "sitemapindex.xml";
			const results = await runner.rewrite_sitemap(options);
			assert(results === 0);
		});

		after(() => {
			mock.restore();
		});
	});
});

suite("rewrite_rss()", () => {
	test("no rss feed should return error exit code (1)", async () => {
		const results = await runner.rewrite_rss(testOp);
		assert(results === 1);
	});

	suite("specified file is not XML", () => {
		before(() => {
			mock({
				"test/src": {
					"index.txt": '<?xml version="1.0" encoding="utf-8" standalone="yes"?>',
				},
			});
		});

		test("should fail but continue running (exit code 0)", async () => {
			const options = cloneObject(testOp);
			options.paths.rss = "index.txt";
			const results = await runner.rewrite_rss(options);
			assert(results === 0);
		});

		after(() => {
			mock.restore();
		});
	});

	suite("Uses rss files", () => {
		before(() => {
			mock({
				"test/src": {
					"index.xml": `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
					<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
					</rss>`,
					blog: {
						"index.xml": `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
						<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
						</rss>`,
					},
				},
			});
		});

		test("should return exit code 0", async () => {
			const options = cloneObject(testOp);
			options.paths.rss = "**/index.xml";
			const results = await runner.rewrite_rss(options);
			assert(results === 0);
		});

		after(() => {
			mock.restore();
		});
	});
});

suite("watch", () => {
	let runnerWatch;
	before(() => {
		runnerWatch = proxyquire("../lib/runner", {
			chokidar: {
				watch: sinon.stub().returns({
					on: sinon.stub().yields(),
				}),
			},
		});
	});

	test("nice is cool", () => {
		const result = runnerWatch.watch(testOp);
		assert(result === 0);
	});
});

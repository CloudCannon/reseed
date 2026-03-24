const mock = require("mock-fs");
const path = require("path");
const assert = require("node:assert");
const { test, suite, before, after } = require("node:test");
const cssRewrite = require("../lib/processors/css");

const filename = "test/testdir";
const dest = "/";
const baseurl = "testbase";

suite("rewrite css", () => {
	test("css file rewritable url should rewrite the url in file", () => {
		const cssCont = "section.hero { background-image: url(../../testImage.jpg);}";
		const rewritten = cssRewrite.rewrite(cssCont, "//testcss.css", "testBaseurl");
		const testReg = /testBaseurl\/testImage\.jpg/;
		assert(testReg.test(rewritten));
	});

	test("css file with ignorable url should return the url unchanged", () => {
		const ignoreURL = /https:\/\/testImage.jpg/;
		const ignorableCss = "section.hero { background-image: url(https://testImage.jpg);}";
		const rewritten = cssRewrite.rewrite(ignorableCss, "//testcss.css", "testBaseurl");
		assert(ignoreURL.test(rewritten));
	});
});

suite("plugin", () => {
	before(() => {
		mock({
			"test/testdir": {
				"testcss.css": "section.hero { background-image: url(../../testImage.jpg);}",
				"emptycss.css": "",
			},
		});
	});

	test("User supplies a valid css file should return 0", () => {
		const file = path.resolve("test/testdir/testcss.css");
		const destTest = path.resolve("test/testdir", "testbase");
		assert(cssRewrite.plugin(file, destTest, "testbase") === 0);
	});

	test("empty css file should return 0", () => {
		const file = path.resolve("test/testdir/emptycss.css");
		const destTest = path.resolve("test/testdir", "testbase");
		assert(cssRewrite.plugin(file, destTest, "testbase") === 0);
	});

	test("No file specified should return 2", () => {
		assert(cssRewrite.plugin("", dest, baseurl) === 2);
	});

	test("No destination specified should return 3", () => {
		assert(cssRewrite.plugin(filename, "", baseurl) === 3);
	});

	test("No baseurl should return 3", () => {
		assert(cssRewrite.plugin(filename, "", null) === 3);
	});

	after(() => {
		mock.restore();
	});
});

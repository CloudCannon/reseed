const cssRewrite = require("../lib/processors/css");
const fs = require("fs-extra");
let expect = require('chai').expect;
let path = require('path');

var filename = "test/testdir";
var dest = "/";
var baseurl = "testbase"


describe("rewrite css", function(){
	context("css file rewritable url", function() {
		it("should rewrite the url in file", function(){
			let cssCont = "section.hero { background-image: url(../../testImage.jpg);}"
			let rewritten = cssRewrite.rewrite(cssCont, "//testcss.css", "testBaseurl");
			let testReg = /testBaseurl\/testImage\.jpg/
			expect(testReg.test(rewritten)).to.equal(true);
		})
	})

	context("css file with ignorable url", function() {
		it("should return the url unchanged", function(){
			let ignoreURL = /https\:\/\/testImage.jpg/
			let ignorableCss = "section.hero { background-image: url(https://testImage.jpg);}"
			let rewritten = cssRewrite.rewrite(ignorableCss, "//testcss.css", "testBaseurl");
			expect(ignoreURL.test(rewritten)).to.equal(true);
		})
	})
})

describe("plugin", function(){
	before(function(){
		fs.mkdirSync("test/testdir");
		let testCSS =  "section.hero { background-image: url(../../testImage.jpg);}"
		fs.writeFileSync("test/testdir/testcss.css", testCSS);
		let emptyCSS =  ""
		fs.writeFileSync("test/testdir/emptycss.css", emptyCSS);
	})

	context("User supplies a valid css file", function(){
		it("should return 0", function(){
			let file = path.resolve("test/testdir/testcss.css");
			let dest = path.resolve("test/testdir", "testbase");
			expect(cssRewrite.plugin(file, dest, "testbase")).to.equal(0);
		})
	})
	context('empty css file', function() {
		it('Should return 0', function(){
			let file = path.resolve("test/testdir/emptycss.css");
			let dest = path.resolve("test/testdir", "testbase");
			expect(cssRewrite.plugin(file, dest, "testbase")).to.equal(0);
		})
	})

	context('No file specified', function() {
		it('should return 1', function() {
			expect(cssRewrite.plugin("", dest, baseurl)).to.equal(1);
		})
	})

	context('No destination specified', function() {
		it('Should return 1', function(){
			expect(cssRewrite.plugin(filename, "", baseurl)).to.equal(1);
		})
	})

	context('No baseurl', function() {
		it('should return 1', function() {
			expect(cssRewrite.plugin(filename, "", null)).to.equal(1);
		})
	})

	after(function(){
		fs.removeSync("test/testdir")
	})

})
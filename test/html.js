const htmlRewrite = require("../lib/processors/html");
const fs = require("fs-extra");
let expect = require('chai').expect;
let path = require('path');

var filename = "test/testdir";
var dest = "/";
var baseurl = "testbase";

describe("rewrite html", function(){
	context("html file with rewritable src", function() {
		it("should rewrite the url in file", function(){
			let htmlCont = `<img src="testImage.jpg" >`
			let rewritten = htmlRewrite.rewrite(htmlCont, "//testhtml.html", "testBaseurl");
			let testReg = /testBaseurl\/testImage\.jpg"/
			expect(testReg.test(rewritten)).to.equal(true);
		})
	})

	context("html file with rewritable srcset", function() {
		it("should rewrite the url in file", function(){
			let htmlCont = `<img srcset="testImage.jpg" >`
			let rewritten = htmlRewrite.rewrite(htmlCont, "//testhtml.html", "testBaseurl");
			let testReg = /testBaseurl\/testImage\.jpg"/
			expect(testReg.test(rewritten)).to.equal(true);
		})
	})

	context("html file with rewritable href", function() {
		it("should rewrite the url in file", function(){
			let htmlCont = `<a href="testImage.jpg" >link </a>`
			let rewritten = htmlRewrite.rewrite(htmlCont, "//testhtml.html", "testBaseurl");
			let testReg = /testBaseurl\/testImage\.jpg/
			expect(testReg.test(rewritten)).to.equal(true);
		})
	})

	context("html file with rewritable meta", function() {
		it("should rewrite the url in file", function(){
			let htmlCont = `<body><meta http-equiv="refresh" content="0;url=testImage.jpg"/></body>`
			let rewritten = htmlRewrite.rewrite(htmlCont, "//testhtml.html", "testBaseurl");
			let testReg = /testBaseurl\/testImage\.jpg/
			expect(testReg.test(rewritten)).to.equal(true);
		})
	})

	context("html file with rewritable style", function() {
		it("should rewrite the url in file", function(){
			let htmlCont = `<style> p {background-img: url("testImage.jpg");} >`
			let rewritten = htmlRewrite.rewrite(htmlCont, "//testhtml.html", "testBaseurl");
			let testReg = /testBaseurl\/testImage\.jpg/
			expect(testReg.test(rewritten)).to.equal(true);
		})
		it("should rewrite the url in file", function(){
			let htmlCont = `<h1 style="background-img: url(testImage.jpg)">text</h1>`
			let rewritten = htmlRewrite.rewrite(htmlCont, "//testhtml.html", "testBaseurl");
			let testReg = /testBaseurl\/testImage\.jpg/
			expect(testReg.test(rewritten)).to.equal(true);
		})
	})



	context("html file with ignorable url", function() {
		it("should return the url unchanged", function(){
			let ignoreURL = /https\:\/\/testImage.jpg/
			let ignorablehtml = `<img src="https://testImage.jpg" >`
			let rewritten = htmlRewrite.rewrite(ignorablehtml, "//testhtml.html", "testBaseurl");
			expect(ignoreURL.test(rewritten)).to.equal(true);
		})
	})
})

describe("plugin", function(){
	before(function(){
		fs.mkdirSync("test/testdir");
		let testhtml =  `<img src="DongSquadLogo.png" >`
		fs.writeFileSync("test/testdir/testhtml.html", testhtml);
		let emptyhtml =  ""
		fs.writeFileSync("test/testdir/emptyhtml.html", emptyhtml);
	})

	context("User supplies a valid html file", function(){
		it("should return 0", function(){
			let file = path.resolve("test/testdir/testhtml.html");
			let dest = path.resolve("test/testdir", "testbase");
			expect(htmlRewrite.plugin(file, dest, "testbase")).to.equal(0);
		})
	})
	context('empty html file', function() {
		it('Should return 0', function(){
			let file = path.resolve("test/testdir/emptyhtml.html");
			let dest = path.resolve("test/testdir", "testbase");
			expect(htmlRewrite.plugin(file, dest, "testbase")).to.equal(0);
		})
	})

	context('No file specified', function() {
		it('should return 1', function() {
			expect(htmlRewrite.plugin("", dest, baseurl)).to.equal(1);
		})
	})

	context('No destination specified', function() {
		it('Should return 1', function(){
			expect(htmlRewrite.plugin(filename, "", baseurl)).to.equal(1);
		})
	})

	context('No baseurl', function() {
		it('should return 1', function() {
			expect(htmlRewrite.plugin(filename, "", null)).to.equal(1);
		})
	})

	after(function(){
		fs.removeSync("test/testdir", {recursive: true})
	})

})
/* eslint-disable prefer-arrow-callback */
const fs = require('fs-extra');
const { expect } = require('chai');
const path = require('path');

const htmlRewrite = require('../lib/processors/html');

const filename = 'test/testdir';
const dest = '/';
const baseurl = 'testbase';

describe('rewrite html', function () {
	context('html file with rewritable src', function () {
		it('should rewrite the url in file', function () {
			const htmlCont = "<img src='testImage.jpg'>";
			const rewritten = htmlRewrite.rewrite(htmlCont, '//testhtml.html', 'testBaseurl');
			const testReg = /src="\/testBaseurl\/testImage\.jpg"/;
			expect(testReg.test(rewritten)).to.equal(true);
		});
	});

	context('html file with rewritable srcset', function () {
		it('should rewrite the url in file', function () {
			const htmlCont = "<img srcset='testImage.jpg'>";
			const rewritten = htmlRewrite.rewrite(htmlCont, '//testhtml.html', 'testBaseurl');
			const testReg = /srcset="\/testBaseurl\/testImage\.jpg"/;
			expect(testReg.test(rewritten)).to.equal(true);
		});
	});

	context('html file with rewritable href', function () {
		it('should rewrite the url in file', function () {
			const htmlCont = "<a href='testImage.jpg' >link </a>";
			const rewritten = htmlRewrite.rewrite(htmlCont, '//testhtml.html', 'testBaseurl');
			const testReg = /testBaseurl\/testImage\.jpg/;
			expect(testReg.test(rewritten)).to.equal(true);
		});
	});

	context('html file with rewritable meta', function () {
		it('should rewrite the url in file', function () {
			const htmlCont = "<body><meta http-equiv='refresh' content='0;url=testImage.jpg'/></body>";
			const rewritten = htmlRewrite.rewrite(htmlCont, '//testhtml.html', 'testBaseurl');
			const testReg = /testBaseurl\/testImage\.jpg/;
			expect(testReg.test(rewritten)).to.equal(true);
		});
	});

	context('html file with rewritable style', function () {
		it('should rewrite the url in file', function () {
			const htmlCont = "<style> p {background-img: url('testImage.jpg');} >";
			const rewritten = htmlRewrite.rewrite(htmlCont, '//testhtml.html', 'testBaseurl');
			const testReg = /testBaseurl\/testImage\.jpg/;
			expect(testReg.test(rewritten)).to.equal(true);
		});

		it('should rewrite the url in file', function () {
			const htmlCont = "<h1 style='background-img: url(testImage.jpg)'>text</h1>";
			const rewritten = htmlRewrite.rewrite(htmlCont, '//testhtml.html', 'testBaseurl');
			const testReg = /testBaseurl\/testImage\.jpg/;
			expect(testReg.test(rewritten)).to.equal(true);
		});
	});

	context('html file with ignorable url', function () {
		it('should return the url unchanged', function () {
			const ignoreURL = /https:\/\/testImage.jpg/;
			const ignorablehtml = "<img src='https://testImage.jpg' >";
			const rewritten = htmlRewrite.rewrite(ignorablehtml, '//testhtml.html', 'testBaseurl');
			expect(ignoreURL.test(rewritten)).to.equal(true);
		});
	});

	context('html file with reseed-ignore', function () {
		it('should return the url unchanged', function () {
			const ignoreURL = /testBaseurl\/testImage\.jpg/;
			const ignorablehtml = "<img src='testImage.jpg' reseed-ignore>";
			const rewritten = htmlRewrite.rewrite(ignorablehtml, '//testhtml.html', 'testBaseurl');
			expect(ignoreURL.test(rewritten)).to.equal(false);
		});
	});
});

describe('plugin', function () {
	before(function () {
		fs.mkdirSync('test/testdir');
		const testhtml = "<img src='DongSquadLogo.png' >";
		fs.writeFileSync('test/testdir/testhtml.html', testhtml);
		const emptyhtml = '';
		fs.writeFileSync('test/testdir/emptyhtml.html', emptyhtml);
	});

	context('User supplies a valid html file', function () {
		it('should return 0', function () {
			const file = path.resolve('test/testdir/testhtml.html');
			const destTest = path.resolve('test/testdir', 'testbase');
			expect(htmlRewrite.plugin(file, destTest, 'testbase')).to.equal(0);
		});
	});

	context('empty html file', function () {
		it('Should return 0', function () {
			const file = path.resolve('test/testdir/emptyhtml.html');
			const destTest = path.resolve('test/testdir', 'testbase');
			expect(htmlRewrite.plugin(file, destTest, 'testbase')).to.equal(0);
		});
	});

	context('No file specified', function () {
		it('should return 1', function () {
			expect(htmlRewrite.plugin('', dest, baseurl)).to.equal(1);
		});
	});

	context('No destination specified', function () {
		it('Should return 1', function () {
			expect(htmlRewrite.plugin(filename, '', baseurl)).to.equal(1);
		});
	});

	context('No baseurl', function () {
		it('should return 1', function () {
			expect(htmlRewrite.plugin(filename, '', null)).to.equal(1);
		});
	});

	after(function () {
		fs.removeSync('test/testdir', { recursive: true });
	});
});

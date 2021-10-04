/* eslint-disable prefer-arrow-callback */
const mock = require('mock-fs');
const { expect } = require('chai');
const path = require('path');

const cssRewrite = require('../lib/processors/css');

const filename = 'test/testdir';
const dest = '/';
const baseurl = 'testbase';

describe('rewrite css', function () {
	context('css file rewritable url', function () {
		it('should rewrite the url in file', function () {
			const cssCont = 'section.hero { background-image: url(../../testImage.jpg);}';
			const rewritten = cssRewrite.rewrite(cssCont, '//testcss.css', 'testBaseurl');
			const testReg = /testBaseurl\/testImage\.jpg/;
			expect(testReg.test(rewritten)).to.equal(true);
		});
	});

	context('css file with ignorable url', function () {
		it('should return the url unchanged', function () {
			const ignoreURL = /https:\/\/testImage.jpg/;
			const ignorableCss = 'section.hero { background-image: url(https://testImage.jpg);}';
			const rewritten = cssRewrite.rewrite(ignorableCss, '//testcss.css', 'testBaseurl');
			expect(ignoreURL.test(rewritten)).to.equal(true);
		});
	});
});

describe('plugin', function () {
	before(function () {
		mock({
			'test/testdir': {
				'testcss.css': 'section.hero { background-image: url(../../testImage.jpg);}',
				'emptycss.css': ''
			}
		});
	});

	context('User supplies a valid css file', function () {
		it('should return 0', function () {
			const file = path.resolve('test/testdir/testcss.css');
			const destTest = path.resolve('test/testdir', 'testbase');
			expect(cssRewrite.plugin(file, destTest, 'testbase')).to.equal(0);
		});
	});
	context('empty css file', function () {
		it('Should return 0', function () {
			const file = path.resolve('test/testdir/emptycss.css');
			const destTest = path.resolve('test/testdir', 'testbase');
			expect(cssRewrite.plugin(file, destTest, 'testbase')).to.equal(0);
		});
	});

	context('No file specified', function () {
		it('should return 2', function () {
			expect(cssRewrite.plugin('', dest, baseurl)).to.equal(2);
		});
	});

	context('No destination specified', function () {
		it('Should return 3', function () {
			expect(cssRewrite.plugin(filename, '', baseurl)).to.equal(3);
		});
	});

	context('No baseurl', function () {
		it('should return 3', function () {
			expect(cssRewrite.plugin(filename, '', null)).to.equal(3);
		});
	});

	after(function () {
		mock.restore();
	});
});

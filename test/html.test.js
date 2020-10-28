/* eslint-disable prefer-arrow-callback */
const fs = require('fs-extra');
const { expect } = require('chai');
const path = require('path');

const htmlRewrite = require('../lib/processors/html');

const filename = 'test/testdir';
const dest = '/';
const baseurl = 'testbase';

describe('rewrite html', function () {
	context('elements with some src attribute', function () {
		context('urls are rewritable', function () {
			it('should rewrite the url in each src attribute', function () {
				const element = `<img src="testImage.jpg">
				<img poster="testImage.jpg">
				<img extraAttrOne="testImage.jpg">
				<img extraAttrTwo="testImage.jpg">`;
				const expectedElement = `<img src="/testBaseurl/testImage.jpg">
				<img poster="/testBaseurl/testImage.jpg">
				<img extraAttrOne="/testBaseurl/testImage.jpg">
				<img extraAttrTwo="/testBaseurl/testImage.jpg">`;
				const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl', ['extraAttrOne', 'extraAttrTwo']);
				expect(rewrittenElement).to.equal(expectedElement);
			});
		});

		context('urls are ignorable', function () {
			it('should return each element unchanged', function () {
				const element = `<img src="https://testImage.jpg">
				<img poster="https://testImage.jpg">
				<img extraAttrOne="https://testImage.jpg">
				<img extraAttrTwo="https://testImage.jpg">`;
				const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl', ['extraAttrOne', 'extraAttrTwo']);
				expect(rewrittenElement).to.equal(element);
			});
		});

		context('elements use reseed-ignore', function () {
			it('should return each element unchanged', function () {
				const element = `<img src="testImage.jpg" reseed-ignore>
				<img poster="testImage.jpg" reseed-ignore>
				<img extraAttrOne="testImage.jpg" reseed-ignore>
				<img extraAttrTwo="testImage.jpg" reseed-ignore>`;
				const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl', ['extraAttrOne', 'extraAttrTwo']);
				expect(rewrittenElement).to.equal(element);
			});
		});
	});

	context('element with srcset attribute', function () {
		context('url is rewritable', function () {
			it('should rewrite the url in the element', function () {
				const element = '<img srcset="testImage.jpg">';
				const expectedElement = '<img srcset="/testBaseurl/testImage.jpg">';
				const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
				expect(rewrittenElement).to.equal(expectedElement);
			});
		});

		context('url is ignorable', function () {
			it('should return the url unchanged', function () {
				const element = '<img srcset="https://testImage.jpg">';
				const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
				expect(rewrittenElement).to.equal(element);
			});
		});

		context('element uses reseed-ignore', function () {
			it('should return the element unchanged', function () {
				const element = '<img srcset="testImage.jpg" reseed-ignore>';
				const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
				expect(rewrittenElement).to.equal(element);
			});
		});
	});

	context('element with href attribute', function () {
		context('url is rewritable', function () {
			it('should rewrite the url in the href', function () {
				const element = '<a href="testImage.jpg">link</a>';
				const expectedElement = '<a href="/testBaseurl/testImage.jpg">link</a>';
				const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
				expect(rewrittenElement).to.equal(expectedElement);
			});
		});

		context('url is ignorable', function () {
			it('should return the <a> element unchanged', function () {
				const element = '<a href="https://testImage.jpg">link</a>';
				const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
				expect(rewrittenElement).to.equal(element);
			});
		});

		context('element uses reseed-ignore', function () {
			it('should return the <a> element unchanged', function () {
				const element = '<a href="testImage.jpg" reseed-ignore>link</a>';
				const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
				expect(rewrittenElement).to.equal(element);
			});
		});
	});

	context('element with meta attribute', function () {
		context('url is rewritable', function () {
			it('should rewrite the url in the element', function () {
				const element = '<body><meta http-equiv="refresh" content="0;url=testImage.jpg"></body>';
				const expectedElement = '<body><meta http-equiv="refresh" content="0;url=/testBaseurl/testImage.jpg"></body>';
				const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
				expect(rewrittenElement).to.equal(expectedElement);
			});
		});

		context('url is ignorable', function () {
			it('should return the element unchanged', function () {
				const element = '<body><meta http-equiv="refresh" content="0;url=https://testImage.jpg"></body>';
				const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
				expect(rewrittenElement).to.equal(element);
			});
		});

		context('element uses reseed-ignore', function () {
			it('should return the element unchanged', function () {
				const element = '<body><meta http-equiv="refresh" content="0;url=testImage.jpg" reseed-ignore></body>';
				const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
				expect(rewrittenElement).to.equal(element);
			});
		});
	});

	context('element with style attribute', function () {
		context('url is rewritable', function () {
			it('should rewrite the url in the element', function () {
				const element = '<h1 style="background-img: url(\'testImage.jpg\')">text</h1>';
				const expectedElement = '<h1 style="background-img: url(\'/testBaseurl/testImage.jpg\')">text</h1>';
				const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
				expect(rewrittenElement).to.equal(expectedElement);
			});
		});

		context('url is ignorable', function () {
			it('should return the element unchanged', function () {
				const element = '<h1 style="background-img: url(\'https://testImage.jpg\')">text</h1>';
				const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
				expect(rewrittenElement).to.equal(element);
			});
		});

		context('element uses reseed-ignore', function () {
			it('should return the element unchanged', function () {
				const element = '<h1 style="background-img: url(testImage.jpg)" reseed-ignore>text</h1>';
				const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
				expect(rewrittenElement).to.equal(element);
			});
		});
	});

	context('style element', function () {
		context('url is rewritable', function () {
			it('should rewrite the url in the element', function () {
				const element = '<style> p {background-img: url("testImage.jpg");}></style>';
				const expectedElement = '<style> p {background-img: url(\'/testBaseurl/testImage.jpg\');}></style>';
				const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
				expect(rewrittenElement).to.equal(expectedElement);
			});
		});

		context('with ignorable url', function () {
			it('should return the element unchanged', function () {
				const element = '<style> p {background-img: url(\'https://testImage.jpg\');}></style>';
				const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
				expect(rewrittenElement).to.equal(element);
			});
		});
	});
});

describe('plugin', function () {
	before(function () {
		fs.mkdirSync('test/testdir');
		const testhtml = "<img src='testimage.png' >";
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

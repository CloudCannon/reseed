const mock = require('mock-fs');
const path = require('path');
const assert = require('node:assert');
const { test, suite, before, after } = require('node:test');
const htmlRewrite = require('../lib/processors/html');

const filename = 'test/testdir';
const dest = '/';
const baseurl = 'testbase';

suite('rewrite html elements with some src attribute', () => {
	test('urls are rewritable should rewrite the url in each src attribute', () => {
		const element = `<img src="testImage.jpg">
			<img poster="testImage.jpg">
			<img extra-attr-one="testImage.jpg">
			<img extra-attr-two="testImage.jpg">`;
		const expectedElement = `<img src="/testBaseurl/testImage.jpg">
			<img poster="/testBaseurl/testImage.jpg">
			<img extra-attr-one="/testBaseurl/testImage.jpg">
			<img extra-attr-two="/testBaseurl/testImage.jpg">`;
		const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl', [
			'extra-attr-one',
			'extra-attr-two',
		]);
		assert(rewrittenElement === expectedElement);
	});

	test('urls are ignorable should return each element unchanged', () => {
		const element = `<img src="https://testImage.jpg">
			<img poster="https://testImage.jpg">
			<img extra-attr-one="https://testImage.jpg">
			<img extra-attr-two="https://testImage.jpg">`;
		const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl', [
			'extra-attr-one',
			'extra-attr-two',
		]);
		assert(rewrittenElement === element);
	});

	test('elements use reseed-ignore should return each element unchanged', () => {
		const element = `<img src="testImage.jpg" reseed-ignore>
			<img poster="testImage.jpg" reseed-ignore>
			<img extra-attr-one="testImage.jpg" reseed-ignore>
			<img extra-attr-two="testImage.jpg" reseed-ignore>`;
		const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl', [
			'extra-attr-one',
			'extra-attr-two',
		]);
		assert(rewrittenElement === element);
	});
});

suite('rewrite html element with srcset attribute', () => {
	test('url is rewritable should rewrite the url in the element', () => {
		const element = '<img srcset="testImage.jpg">';
		const expectedElement = '<img srcset="/testBaseurl/testImage.jpg">';
		const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
		assert(rewrittenElement === expectedElement);
	});

	test('url is ignorable should return the url unchanged', () => {
		const element = '<img srcset="https://testImage.jpg">';
		const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
		assert(rewrittenElement === element);
	});

	test('element uses reseed-ignore should return the element unchanged', () => {
		const element = '<img srcset="testImage.jpg" reseed-ignore>';
		const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
		assert(rewrittenElement === element);
	});
});

suite('rewrite html element with href attribute', () => {
	test('url is rewritable should rewrite the url in the href', () => {
		const element = `<a href="testImage.jpg">link</a>
			<a href="testPage/noSlash">link</a>
			<a href="testPage/withSlash/">link</a>
			<a href="/">link</a>
			<a href="">link</a>
			<a>link</a>`;
		const expectedElement = `<a href="/testBaseurl/testImage.jpg">link</a>
			<a href="/testBaseurl/testPage/noSlash">link</a>
			<a href="/testBaseurl/testPage/withSlash/">link</a>
			<a href="/testBaseurl/">link</a>
			<a href>link</a>
			<a>link</a>`;
		const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
		assert(rewrittenElement === expectedElement);
	});

	test('url is ignorable should return the <a> element unchanged', () => {
		const element = '<a href="https://testImage.jpg">link</a>';
		const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
		assert(rewrittenElement === element);
	});

	test('element uses reseed-ignore should return the <a> element unchanged', () => {
		const element = '<a href="testImage.jpg" reseed-ignore>link</a>';
		const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
		assert(rewrittenElement === element);
	});
});

suite('rewrite html element with meta attribute', () => {
	test('url is rewritable should rewrite the url in the element', () => {
		const element = '<body><meta http-equiv="refresh" content="0;url=testImage.jpg"></body>';
		const expectedElement =
			'<body><meta http-equiv="refresh" content="0;url=/testBaseurl/testImage.jpg"></body>';
		const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
		assert(rewrittenElement === expectedElement);
	});

	test('url is ignorable should return the element unchanged', () => {
		const element =
			'<body><meta http-equiv="refresh" content="0;url=https://testImage.jpg"></body>';
		const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
		assert(rewrittenElement === element);
	});

	test('element uses reseed-ignore should return the element unchanged', () => {
		const element =
			'<body><meta http-equiv="refresh" content="0;url=testImage.jpg" reseed-ignore></body>';
		const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
		assert(rewrittenElement === element);
	});
});

suite('rewrite html element with style attribute', () => {
	test('url is rewritable should rewrite the url in the element', () => {
		const element = '<h1 style="background-img: url(\'testImage.jpg\')">text</h1>';
		const expectedElement =
			'<h1 style="background-img: url(\'/testBaseurl/testImage.jpg\')">text</h1>';
		const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
		assert(rewrittenElement === expectedElement);
	});

	test('url is ignorable should return the element unchanged', () => {
		const element = '<h1 style="background-img: url(\'https://testImage.jpg\')">text</h1>';
		const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
		assert(rewrittenElement === element);
	});

	test('element uses reseed-ignore should return the element unchanged', () => {
		const element = '<h1 style="background-img: url(testImage.jpg)" reseed-ignore>text</h1>';
		const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
		assert(rewrittenElement === element);
	});
});

suite('rewrite html style element', () => {
	test('url is rewritable should rewrite the url in the element', () => {
		const element = '<style> p {background-img: url("testImage.jpg");}></style>';
		const expectedElement =
			"<style> p {background-img: url('/testBaseurl/testImage.jpg');}></style>";
		const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
		assert(rewrittenElement === expectedElement);
	});

	test('with ignorable url should return the element unchanged', () => {
		const element = "<style> p {background-img: url('https://testImage.jpg');}></style>";
		const rewrittenElement = htmlRewrite.rewrite(element, '//testhtml.html', 'testBaseurl');
		assert(rewrittenElement === element);
	});
});

suite('plugin', () => {
	before(() => {
		mock({
			'test/testdir': {
				'testhtml.html': '<img src="testimage.png" >',
				'emptyhtml.html': '',
			},
		});
	});

	test('User supplies a valid html file should return 0', () => {
		const file = path.resolve('test/testdir/testhtml.html');
		const destTest = path.resolve('test/testdir', 'testbase');
		assert(htmlRewrite.plugin(file, destTest, 'testbase') === 0);
	});

	test('empty html file should return 0', () => {
		const file = path.resolve('test/testdir/emptyhtml.html');
		const destTest = path.resolve('test/testdir', 'testbase');
		assert(htmlRewrite.plugin(file, destTest, 'testbase') === 0);
	});

	test('No file specified should return 2', () => {
		assert(htmlRewrite.plugin('', dest, baseurl) === 2);
	});

	test('No destination specified should return 3', () => {
		assert(htmlRewrite.plugin(filename, '', baseurl) === 3);
	});

	test('No baseurl should return 3', () => {
		assert(htmlRewrite.plugin(filename, 'dest', null) === 3);
	});

	after(() => {
		mock.restore();
	});
});

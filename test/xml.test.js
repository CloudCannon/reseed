/* eslint-disable prefer-arrow-callback */
const { expect } = require('chai');
const mock = require('mock-fs');
const xmlRewrite = require('../lib/processors/xml');

describe('rewrite xml', function () {
	context('sitemap with "xhtml:link" and "loc" nodes', function () {
		it('should rewrite the url in each node', function () {
			const xmlString = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
			<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">

				<url>
				<loc>http://example.org/advice/</loc>
				<lastmod>2016-11-11T00:00:00+13:00</lastmod>
				<xhtml:link rel="alternate" hreflang="gr" href="https://www.example.org/advice/"/>
				<xhtml:link rel="alternate" hreflang="en" href="https://www.example.org/advice/"/>
				</url>

				<url>
				<loc>http://example.org/about/our-people/sam</loc>
				<lastmod>2016-11-11T00:00:00+13:00</lastmod>
				</url>
			</urlset>`;
			const expectedXmlString = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
			<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">

				<url>
				<loc>http://example.org/testBaseurl/advice/</loc>
				<lastmod>2016-11-11T00:00:00+13:00</lastmod>
				<xhtml:link rel="alternate" hreflang="gr" href="https://www.example.org/testBaseurl/advice/"/>
				<xhtml:link rel="alternate" hreflang="en" href="https://www.example.org/testBaseurl/advice/"/>
				</url>

				<url>
				<loc>http://example.org/testBaseurl/about/our-people/sam</loc>
				<lastmod>2016-11-11T00:00:00+13:00</lastmod>
				</url>
			</urlset>`;
			const rewrittenElement = xmlRewrite.rewrite(xmlString, 'testBaseurl');
			expect(rewrittenElement).to.equal(expectedXmlString);
		});
	});

	context('rss feed with "link" nodes', function () {
		it('should rewrite the url in each node', function () {
			const xmlString = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
			<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
				<channel>
					<title>Site title</title>
					<link>http://example.org/</link>
					<description>Site description</description>
					<generator>Generator</generator>
					<language>en-us</language>
					<lastBuildDate>Fri, 12 Aug 2016 00:00:00 +0000</lastBuildDate><atom:link href="http://example.org/index.xml" rel="self" type="application/rss+xml"/>
					<item>
						<title>Advice</title>
						<link>http://example.org/advice/</link>
						<pubDate>Fri, 12 Aug 2016 00:00:00 +0000</pubDate>

						<guid>http://example.org/advice/</guid>
						<description>Advice</description>
					</item>
				</channel>
			</rss>`;
			const expectedXmlString = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
			<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
				<channel>
					<title>Site title</title>
					<link>http://example.org/testBaseurl/</link>
					<description>Site description</description>
					<generator>Generator</generator>
					<language>en-us</language>
					<lastBuildDate>Fri, 12 Aug 2016 00:00:00 +0000</lastBuildDate><atom:link href="http://example.org/testBaseurl/index.xml" rel="self" type="application/rss+xml"/>
					<item>
						<title>Advice</title>
						<link>http://example.org/testBaseurl/advice/</link>
						<pubDate>Fri, 12 Aug 2016 00:00:00 +0000</pubDate>

						<guid>http://example.org/advice/</guid>
						<description>Advice</description>
					</item>
				</channel>
			</rss>`;
			const rewrittenElement = xmlRewrite.rewrite(xmlString, 'testBaseurl');
			expect(rewrittenElement).to.equal(expectedXmlString);
		});
	});
});

describe('plugin', function () {
	before(function () {
		mock({
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
			</sitemapindex>`,
			emptySitemap: {
				'sitemap.xml': ''
			},
			testDir: {
				'sitemap.xml': '<sitemap contents>'
			}
		});
	});

	context('elements with some src attribute', function () {
		it('should rewrite the url in each loc node', function () {
			const fileList = xmlRewrite.plugin('sitemapindex.xml', 'testDir/destTest', 'testbase');
			expect(fileList).to.deep.equal(['http://example.org/sitemaps/pagelist.xml', 'http://example.org/sitemaps/morepages.xml']);
		});
	});

	context('valid sitemap file', function () {
		it('Should return 0', function () {
			const file = 'testDir/sitemap.xml';
			const destTest = 'testDir/destTest';
			expect(xmlRewrite.plugin(file, destTest, 'testbase')).to.equal(0);
		});
	});

	context('empty sitemap file', function () {
		it('Should return 0', function () {
			const file = 'emptySitemap/sitemap.xml';
			const destTest = 'emptySitemap/destTest';
			expect(xmlRewrite.plugin(file, destTest, 'testbase')).to.equal(0);
		});
	});

	context('No file specified', function () {
		it('should return 1', function () {
			expect(xmlRewrite.plugin('', 'dest', 'testbase')).to.equal(1);
		});
	});

	context('No destination specified', function () {
		it('Should return 1', function () {
			expect(xmlRewrite.plugin('filename', '', 'baseurl')).to.equal(1);
		});
	});

	context('No baseurl', function () {
		it('should return 1', function () {
			expect(xmlRewrite.plugin('filename', 'dest', null)).to.equal(1);
		});
	});

	after(function () {
		mock.restore();
	});
});

const assert = require("node:assert");
const { test, suite, before, after } = require("node:test");
const mock = require("mock-fs");
const xmlRewrite = require("../lib/processors/xml");

suite("rewrite xml", () => {
	test('sitemap with "xhtml:link" and "loc" nodes should rewrite the url in each node', () => {
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
		const rewrittenElement = xmlRewrite.rewrite(xmlString, "testBaseurl");
		assert(rewrittenElement === expectedXmlString);
	});

	test('rss feed with "link" nodes should rewrite the url in each node', () => {
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
		const rewrittenElement = xmlRewrite.rewrite(xmlString, "testBaseurl");
		assert(rewrittenElement === expectedXmlString);
	});
});

suite("plugin", () => {
	before(() => {
		mock({
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
			</sitemapindex>`,
			emptySitemap: {
				"sitemap.xml": "",
			},
			testDir: {
				"sitemap.xml": "<sitemap contents>",
			},
		});
	});

	test("elements with some src attribute should rewrite the url in each loc node", () => {
		const fileList = xmlRewrite.plugin("sitemapindex.xml", "testDir/destTest", "testbase");
		assert.deepStrictEqual(fileList, [
			"http://example.org/sitemaps/pagelist.xml",
			"http://example.org/sitemaps/morepages.xml",
		]);
	});

	test("valid sitemap file Should return 0", () => {
		const file = "testDir/sitemap.xml";
		const destTest = "testDir/destTest";
		assert(xmlRewrite.plugin(file, destTest, "testbase") === 0);
	});

	test("empty sitemap file Should return 0", () => {
		const file = "emptySitemap/sitemap.xml";
		const destTest = "emptySitemap/destTest";
		assert(xmlRewrite.plugin(file, destTest, "testbase") === 0);
	});

	test("No file specified should return 1", () => {
		assert(xmlRewrite.plugin("", "dest", "testbase") === 1);
	});

	test("No destination specified Should return 1", () => {
		assert(xmlRewrite.plugin("filename", "", "baseurl") === 1);
	});

	test("No baseurl should return 1", () => {
		assert(xmlRewrite.plugin("filename", "dest", null) === 1);
	});

	after(() => {
		mock.restore();
	});
});

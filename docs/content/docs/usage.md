---
date: 2022-10-12T00:00:00Z
title: Using Reseed
nav_title: Usage
nav_section: Installing
weight: 2
---
The Reseed CLI uses the following structure:

```shell
reseed [command] [options]
```

## Commands&nbsp;

> All commands (except [`clean`](#reseed-clean)) require both `baseurl` and `dest` options set. The [`clean`](#reseed-clean) command only requires the `dest` option set. See [Options](#options) for more info.

### `reseed`

Cleans destination directory, and copies files from `src` to dest`/baseurl`. CSS and HTML files have their hrefs/urls/etc (excluding external links) rewritten so that baseurl is prepended.

**Example:**

```
$ reseed -s path/to/src -d path/to/dest -b baseurl
```

### `reseed clean`

Deletes all files in the destination directory.

**Example:**

```
$ reseed clean -d path/to/dest
```

### `reseed clone-assets`

Copy all files (excluding CSS and HTML) from source to destination/baseurl without altering the data.

**Example:**

```
$ reseed clone-assets -b baseurl -d path/to/dest
```

### `reseed rewrite-css`

Copies css files from src to dest/baseurl. Then rewrites the newly copied files so that urls/hrefs/etc that reference local content have baseurl prepended to them.

**Example:**

```
$ reseed rewrite-css -b baseurl -d path/to/dest
```

### `reseed rewrite-html`

Copies html files from src to dest/baseurl. Rewrites the newly copied files so that internal urls/hrefs/etc have baseurl prepended to them.

**Example:**

```
$ reseed rewrite-html -b baseurl -d path/to/dest
```

### `reseed rewrite-sitemap`

Copies the sitemap from src to dest/baseurl. Rewrites the copied file so that links have baseurl prepended to them. If the provided file is a sitemap index, the referenced sitemaps will be processed similarly.

The sitemap (or sitemap index) file can be specified using the `-m | --sitemap` option. If no sitemap file is specified, will default to `sitemap.xml`.

**Example:**

```
$ reseed rewrite-sitemap -b baseurl -d path/to/dest -m sitemapindex.xml
```

### `reseed serve`

Runs [`reseed`](#reseed), then serves the files on a local webserver, so that they may be viewed in a browser. Then runs [`watch`](#reseed-watch).

**Example:**

```
$ reseed serve -s path/to/src -d path/to/dest -b baseurl
```

### `reseed watch`

Continuously watches the src directory to check for changes. If a change occurs, a new build is triggered, and the browser is then reloaded.

**Example:**

```
$ reseed watch -s path/to/src -d path/to/dest -b baseurl
```

# Options

&lt;table&gt;&lt;thead&gt;&lt;tr&gt;&lt;th&gt;Option&lt;/th&gt;&lt;th&gt;Alias&lt;/th&gt;&lt;th&gt;Type&lt;/th&gt;&lt;th&gt;Description&lt;/th&gt;&lt;/tr&gt;&lt;/thead&gt;&lt;tbody&gt;&lt;tr&gt;&lt;td&gt;&lt;code&gt;--source&lt;/code&gt;&lt;/td&gt;&lt;td&gt;&lt;code&gt;-s&lt;/code&gt;&lt;/td&gt;&lt;td&gt;String&lt;/td&gt;&lt;td&gt;The source folder to clone. Defaults to current working directory.&lt;/td&gt;&lt;/tr&gt;&lt;tr&gt;&lt;td&gt;&lt;code&gt;--dest&lt;/code&gt;&lt;/td&gt;&lt;td&gt;&lt;code&gt;-d&lt;/code&gt;&lt;/td&gt;&lt;td&gt;String&lt;/td&gt;&lt;td&gt;The destination folder to clone the files to.&lt;/td&gt;&lt;/tr&gt;&lt;tr&gt;&lt;td&gt;&lt;code&gt;--baseurl&lt;/code&gt;&lt;/td&gt;&lt;td&gt;&lt;code&gt;-b&lt;/code&gt;&lt;/td&gt;&lt;td&gt;String&lt;/td&gt;&lt;td&gt;The filename to prepend to the files in the source.&lt;/td&gt;&lt;/tr&gt;&lt;tr&gt;&lt;td&gt;&lt;code&gt;--port&lt;/code&gt;&lt;/td&gt;&lt;td&gt;&lt;code&gt;-p&lt;/code&gt;&lt;/td&gt;&lt;td&gt;Integer&lt;/td&gt;&lt;td&gt;The port number to serve the cloned site on.&lt;/td&gt;&lt;/tr&gt;&lt;tr&gt;&lt;td&gt;&lt;code&gt;--extrasrc&lt;/code&gt;&lt;/td&gt;&lt;td&gt;&lt;code&gt;-e&lt;/code&gt;&lt;/td&gt;&lt;td&gt;String&lt;/td&gt;&lt;td&gt;Extra src attribute to be rewritten.&lt;/br&gt;Can set multiple attributes by specifying the flag multiple times.&lt;/td&gt;&lt;/tr&gt;&lt;tr&gt;&lt;td&gt;&lt;code&gt;--sitemap&lt;/code&gt;&lt;/td&gt;&lt;td&gt;&lt;code&gt;-m&lt;/code&gt;&lt;/td&gt;&lt;td&gt;String&lt;/td&gt;&lt;td&gt;Path to the index sitemap. Defaults to &lt;code&gt;sitemap.xml&lt;/code&gt;.&lt;/td&gt;&lt;/tr&gt;&lt;tr&gt;&lt;td&gt;&lt;code&gt;--overwrite&lt;/code&gt;&lt;/td&gt;&lt;td&gt;&lt;code&gt;-o&lt;/code&gt;&lt;/td&gt;&lt;td&gt;Boolean&lt;/td&gt;&lt;td&gt;When cleaning &lt;code&gt;--dest&lt;/code&gt;, don't prompt for confirmation.&lt;/td&gt;&lt;/tr&gt;&lt;tr&gt;&lt;td&gt;&lt;code&gt;--split&lt;/code&gt;&lt;/td&gt;&lt;td&gt; &lt;/td&gt;&lt;td&gt;Integer&lt;/td&gt;&lt;td&gt;The number of partitions to divide files into.&lt;/td&gt;&lt;/tr&gt;&lt;tr&gt;&lt;td&gt;&lt;code&gt;--partition&lt;/code&gt;&lt;/td&gt;&lt;td&gt; &lt;/td&gt;&lt;td&gt;Integer&lt;/td&gt;&lt;td&gt;The partition number to process.&lt;/td&gt;&lt;/tr&gt;&lt;tr&gt;&lt;td&gt;&lt;code&gt;--help&lt;/code&gt;&lt;/td&gt;&lt;td&gt; &lt;/td&gt;&lt;td&gt;Boolean&lt;/td&gt;&lt;td&gt;Show help in the terminal&lt;/td&gt;&lt;/tr&gt;&lt;/tbody&gt;&lt;/table&gt;
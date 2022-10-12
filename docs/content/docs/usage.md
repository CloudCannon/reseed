---
date: 2022-10-12T00:00:00Z
title: Using Reseed
nav_title: Usage
nav_section: Installing
weight: 2
---

The Reseed CLI is run with **one** command, followed by one or more options in any order.


All commands (except [`clean`](#reseed-clean)) require both `baseurl` and `dest` options set.
The [`clean`](#reseed-clean) command only requires the `dest` option set.

See [Options](#options) for more info.

## Commands

> All commands will first delete the directory specified by `--dest`.
> Be sure this option is configured correctly to avoid deleting the wrong files!


### reseed

Cleans destination directory, and copies files from `src` to `dest`/`baseurl`.
CSS and HTML files have their hrefs/urls/etc (excluding external links) rewritten so that baseurl is prepended.
If the site has a `sitemap.xml`, the urls within that sitemap will also be rewritten. 

**Example:**

```
$ reseed -s path/to/src -d path/to/dest -b baseurl
```

### reseed clean

Deletes all files in the destination directory.

**Example:**

```
$ reseed clean -d path/to/dest
```

### reseed clone-assets

Copy all files (excluding CSS and HTML) from source to `dest`/`baseurl` without altering the data.

**Example:**

```
$ reseed clone-assets -b baseurl -d path/to/dest
```

### reseed rewrite-css

Copies CSS files from `src` to `dest`/`baseurl`.
Then rewrites the newly copied files so that internal urls/hrefs/etc have `baseurl` prepended to them.

**Example:**

```
$ reseed rewrite-css -b baseurl -d path/to/dest
```

### reseed rewrite-html

Copies HTML files from `src` to `dest`/`baseurl`.
Rewrites the newly copied files so that internal urls/hrefs/etc have `baseurl` prepended to them.

**Example:**

```
$ reseed rewrite-html -b baseurl -d path/to/dest
```

### reseed rewrite-sitemap

Copies the sitemap (defaults to `sitemap.xml`) from `src` to `dest`/`baseurl`. 
Rewrites the copied file so that links have baseurl prepended to them. 
If the provided file is a sitemap index, the referenced sitemaps will also be processed.

The sitemap (or sitemap index) file can be specified using the `-m | --sitemap` option.
If no sitemap file is specified, will default to `sitemap.xml`.

**Example:**

```
$ reseed rewrite-sitemap -b baseurl -d path/to/dest -m sitemapindex.xml
```

### reseed serve

Runs [`reseed`](#reseed), then serves the copied files on a local webserver to be viewed in a browser.
Then runs [`watch`](#reseed-watch).

**Example:**

```
$ reseed serve -s path/to/src -d path/to/dest -b baseurl
```

### reseed watch

Continuously watches the `src` directory to check for changes.
If a change occurs, a new build is triggered, and the browser is then reloaded.

**Example:**

```
$ reseed watch -s path/to/src -d path/to/dest -b baseurl
```

## Options

Option        | Alias | Type    | Description
------------- | ----- | ------- | -----------
`--source`    | `-s`  | String  | The source folder to clone. Defaults to current working directory.
`--dest`      | `-d`  | String  | The destination folder to clone the files to.
`--baseurl`   | `-b`  | String  | The filename to prepend to the files in the source.
`--port`      | `-p`  | Integer | The port number to serve the cloned site on.
`--extrasrc`  | `-e`  | String  | Extra src attribute to be rewritten.</br>Can set multiple attributes by specifying the flag multiple times.
`--sitemap`   | `-m`  | String  | Path to the index sitemap. Defaults to `sitemap.xml`.
`--overwrite` | `-o`  | Boolean | When cleaning `--dest`, don't prompt for confirmation.
`--split`     |       | Integer | The number of partitions to divide files into.
`--partition` |       | Integer | The partition number to process.
`--help`      |       | Boolean | Show help in the terminal
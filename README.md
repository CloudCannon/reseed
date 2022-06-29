# Reseed
Reseed is an open-source tool for integrating static sites into subpaths.

Requires node >=10.0.0

[![Build Status](https://travis-ci.com/CloudCannon/reseed.svg?token=PCpTqbePqYxMDyjhMTKF&branch=master)](https://travis-ci.com/CloudCannon/reseed)
[![codecov](https://codecov.io/gh/CloudCannon/reseed/branch/master/graph/badge.svg?token=Q4yyn9DLZ6)](https://codecov.io/gh/CloudCannon/reseed)



## Contents
- [Installation & Usage](#installation-&-usage)
- [Commands](#commands)
	- [reseed](#reseed)
	- [reseed clone-assets](#reseed-clone-assets)
	- [reseed rewrite-css](#reseed-rewrite-css)
	- [reseed rewrite-html](#reseed-rewrite-html)
	- [reseed rewrite-sitemap](#reseed-rewrite-sitemap)
	- [reseed serve](#reseed-serve)
	- [reseed watch](#reseed-watch)
- [Options](#Options)


# Installation & Usage

Install with npm globally: `npm install -g reseed` or as a dev dependency: `npm install -D reseed`.\
Then run using the following structure:

```
$ reseed [command] [options]
```

For example: `reseed -s path/to/src -d path/to/dest -b baseurl`

Once installed you can also set up your `package.json` with a custom script, such as:

```JSON
{
  "scripts": {
    "reseed": "reseed -s path/to/src -d path/to/dest -b baseurl"
  }
}
```
Then use `npm run reseed` within your project.

Alternatively, you can use `npx` to avoid installing `reseed` as a dependency.\
For example: `npx reseed -s path/to/src -d path/to/dest -b baseurl`


# Commands

> All commands (except [```clean```](#reseed-clean)) require both `baseurl` and `dest` options set.\
> The [```clean```](#reseed-clean) command only requires the `dest` option set.
>
> See [Options](#options) for more info.

</br>

## ```reseed```
Cleans destination directory, and copies files from src to dest/baseurl.
CSS and HTML files have their hrefs/urls/etc (excluding external links) rewritten so that baseurl is prepended.

#### Example:
```
$ reseed -s path/to/src -d path/to/dest -b baseurl
```



## ```reseed clean```

Deletes all files in the destination directory.

#### Example:
```
$ reseed clean -d path/to/dest
```


## ```reseed clone-assets```
Copy all files (excluding CSS and HTML) from source to destination/baseurl without altering the data.

#### Example:
```
$ reseed clone-assets -b baseurl -d path/to/dest
```


## ```reseed rewrite-css```
Copies css files from src to dest/baseurl.
Then rewrites the newly copied files so that urls/hrefs/etc that reference local
content have baseurl prepended to them.

#### Example:
```
$ reseed rewrite-css -b baseurl -d path/to/dest
```


## ```reseed rewrite-html```
Copies html files from src to dest/baseurl.
Rewrites the newly copied files so that internal urls/hrefs/etc have baseurl prepended to them.

#### Example:
```
$ reseed rewrite-html -b baseurl -d path/to/dest
```


## ```reseed rewrite-sitemap```
Copies the sitemap from src to dest/baseurl. Rewrites the copied file so that links have baseurl prepended to them.
If the provided file is a sitemap index, the referenced sitemaps will be processed similarly.

The sitemap (or sitemap index) file can be specified using the `-m | --sitemap` option. If no sitemap file is specified, will default to `sitemap.xml`.

#### Example:
```
$ reseed rewrite-sitemap -b baseurl -d path/to/dest -m sitemapindex.xml
```


## ```reseed serve```
Runs [```reseed```](#reseed), then serves the files on a local webserver, so that they may be viewed in a browser. Then runs [```watch```](#reseed-watch).

#### Example:
```
$ reseed serve -s path/to/src -d path/to/dest -b baseurl
```


## ```reseed watch```
Continuously watches the src directory to check for changes. If a change
occurs, a new build is triggered, and the browser is then reloaded.

#### Example:
```
$ reseed watch -s path/to/src -d path/to/dest -b baseurl
```

## Ignore
Prevents reseed from adding the baseurl infront of an elements path
```
<a href="/manual" reseed-ignore>Click me!</a>
```

# Options

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

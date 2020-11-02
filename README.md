# Reseed
Allows you to make a clone of your site with a different baseurl.

Requires node >=10.0.0

[![Build Status](https://travis-ci.com/CloudCannon/reseed.svg?token=PCpTqbePqYxMDyjhMTKF&branch=master)](https://travis-ci.com/CloudCannon/reseed)
[![codecov](https://codecov.io/gh/CloudCannon/reseed/branch/master/graph/badge.svg?token=Q4yyn9DLZ6)](https://codecov.io/gh/CloudCannon/reseed)



## Contents

- [reseed](##reseed)
- [reseed clean](##clean)
- [reseed clone-assets](##reseed-clone-assets)
- [reseed rewrite-css](##reseed=rewrite-css)
- [reseed rewrite-html](##reseed-rewrite-html)
- [reseed serve](##reseed-serve)
- [reseed watch](##reseed-watch)
- [Flags](##Flags)


# Commands


## ```reseed```
Cleans destination directory, and copies files from src to dest/baseurl.
CSS and HTML files have their hrefs/urls/etc (excluding external links) rewritten so that baseurl is prepended.

#### Example:
```
$ reseed -s path/to/src -d path/to/dest -b baseurlName
```

#### Required flags:
`[ -b | --baseurl ], [ -d | --dest ]`



## ```reseed-clean```

Deletes all files in the destination directory.

#### Example:
```
$ reseed clean -d path/to/dest
```

#### Required flags:
`[ -d | --dest ]`


## ```reseed clone-assets```
Copy all but files (excluding CSS and HTML) from source to destination/baseurl without altering the data.

#### Example:
```
$ reseed clone-assets -b baseurl
```

#### Required flags:
`[ -b | --baseurl ], [ -d | --dest ]`


## ```reseed rewrite-css```
Copies css files from src to dest/baseurl.
Then rewrites the newly copied files so that urls/hrefs/etc that reference local
content have baseurl prepended to them.

#### Example:
```
$ reseed rewrite-css -b baseurlName
```

#### Required flags:
`[ -b | --baseurl ], [ -d | --dest ]`


## ```reseed rewrite-html```
Copies html files from src to dest/baseurl.
Rewrites the newly copied files so that internal urls/hrefs/etc have baseurl prepended to them.

#### Example:
```
$ reseed rewrite-html -b baseurlName
```

#### Required flags:
`[ -b | --baseurl ], [ -d | --dest ]`


## ```reseed serve```
Runs [```build```](##reseed-build), then serves the files on a local webserver, so that they my be viewed in a browser. Then runs [```watch```](##reseed-watch).

#### Example:
```
$ reseed serve -d path/to/dest
```

#### Required flags:
`[ -b | --baseurl ], [ -d | --dest ]`


## ```reseed watch```
Continuously watches the src directory to check for changes. If a change
occurs, then the browser that is viewing the local webserver will be reloaded, so
that the new content can be viewed. Because this process runs continously, it does
not return an exit code because it must be cancelled by the user in-terminal.

#### Example:
```
$ reseed watch -s path/to/src
```

# Flags
```
    -s | --source       The source folder to clone. Defaults to dist/site.
    -d | --dest         The destination folder to clone the files to. Defaults to dist/prod.
    -b | --baseurl      The filename to prepend to the files in the source.
    -p | --port         The portnumber to serve the cloned site on.
    -e | --extrasrc     A list of extra src attributes to be rewritten.
    -o | --overwrite    When cleaning --dest, don't prompt for confirmation.
    --split             The number of partitions to divide files into.
    --partition         The partition number to process.
	--help				Show help in the terminal.
```

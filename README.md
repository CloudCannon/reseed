# Reseed
Allows you to make a clone of your site with a different baseurl.

Requires node >=10.0.0

[![Build Status](https://travis-ci.com/CloudCannon/cli-dist.svg?token=PCpTqbePqYxMDyjhMTKF&branch=master)](https://travis-ci.com/CloudCannon/reseed)
[![codecov](https://codecov.io/gh/CloudCannon/reseed/branch/master/graph/badge.svg?token=Q4yyn9DLZ6)](https://codecov.io/gh/CloudCannon/reseed)



## Contents
<ul>
    <li> Build
    <li> Clean
    <li> Clone Assets
    <li> Dist
    <li> Rewrite CSS
    <li> Rewrite HTML
    <li> Serve
    <li> Watch
</ul>

# Commands


## Build
##### ```build```
Cleans dest, and copies files from src to dest/baseurl.
CSS and HTML files have their hrefs/urls/etc to include baseurl.

#### Example:

```
$ dist build -b baseurlName
```

#### Required flags:
[-b | --baseurl ]



## Clean
##### ```clean```

Deletes all files in dest.

#### Example:
```
$ dist clean -d path/To/Destination
```


## Clone Assets
##### ```clone-assets```
Copy the files from source to destination/baseurl without altering the data in any way.

#### Example:
```
$ dist clone-assets -b baseurl
```

#### Required flags:
[-b | --baseurl ]

## Dist
##### ```dist```
Runs build, serve, then watch.
Is the default command (runs when no command is specified by user.)

#### Example:
```
$ dist -s path/to/src -d path/to/dest -b baseurlName
```

#### Required flags:
[-b | --baseurl ]


## Rewrite CSS
##### ```rewrite-css```
Copies css files from src to dest/baseurl.
Then rewrites the newly copied files so that urls/hrefs/etc that reference local
content have baseurl prepended to them.

#### Example:
```
$ dist rewrite-css -b baseurlName
```
#### Required flags:
[-b | --baseurl ]


## Rewrite HTML
##### ```rewrite-html```
Copies html files from src to dest/baseurl.
Rewrites the newly copied files so that urls/hrefs/etc that reference local
content have baseurl prepended to them.

#### Example:
```
$ dist rewrite-html -b baseurlName
```

#### Required flags:
[-b | --baseurl ]

## Serve
##### ```serve```
Serves the files on a local webserver, so that they my be viewed in a browser.

#### Example:
```
$ dist serve -d path/to/dest
```


## Watch
##### ```watch```
Continuously watches the dest/baseurl directory to check for changes. If a change
occurs, then the browser that is viewing the local webserver will be reloaded, so
that the new content can be viewed. Because this process runs continously, it does
not return an exit code because it must be cancelled by the user in-terminal.

#### Example:
```
$ dist watch -d path/to/dest
```

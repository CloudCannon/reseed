---
date: 2022-10-12
title: "Installing and running Reseed"
nav_title: "Installation"
nav_section: Installing
weight: 1
---

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
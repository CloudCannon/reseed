---
date: 2022-10-12T00:00:00Z
title: Installing and running Reseed
nav_title: Installation
nav_section: Installing
weight: 1
---
Reseed is an open-source tool for integrating static sites into subpaths. In order to keep up to date with your content changes, it should be run as part of your site build process.

Requires node `^10.0.0`

## Installation

Install with npm globally: `npm install -g reseed`

or as a dev dependency in your project: `npm install -D reseed`

## Running

Reseed is run using the following structure:

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

## Running via npx

Alternatively, you can use `npx` to avoid installing `reseed` as a dependency.

For example:

```
npx reseed -s path/to/src -d path/to/dest -b baseurl
```
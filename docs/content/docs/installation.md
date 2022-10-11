---
date: 2022-10-12T00:00:00Z
title: Installing and running Reseed
nav_title: Installation
nav_section: Installing
weight: 1
---
# Reseed

Reseed is an open-source tool for integrating static sites into subpaths.

Requires node &gt;=10.0.0

## Installation

Install with npm globally: `npm install -g reseed` or as a dev dependency: `npm install -D reseed`
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

## Running via npx

Alternatively, you can use `npx` to avoid installing `reseed` as a dependency.&lt;br&gt;For example: `npx reseed -s path/to/src -d path/to/dest -b baseurl`
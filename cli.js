#!/usr/bin/env node
const meow = require("meow");
const path = require("path");
const runner = require("./lib/runner");
const objectHelper = require("./lib/helpers/object-helper");

const helpText = `Usage
     $ dist -s <source directory> -d <output directory> -b <base url>

     Options
       -s  Source directory of the files to clone
       -d  Where to clone the files to
       -b  The base url to use

     Examples
       $ dist -d my-output -b en
`;

const cli = meow(
  helpText,
  {
    flags: {
  		source: {
  			type: 'string',
  			alias: 's'
      },
      dist: {
          type: 'string',
          alias: 'd'
      },
      baseurl: {
          type: 'string',
          alias: 'b'
      }
    }
  }
);

// If there are no arguments, present the help menu
if( objectHelper.isEmpty(cli.flags) ) {
  console.log(helpText);
  process.exit();
}

let source = cli.flags["s"] || process.cwd();
let destination = cli.flags["d"] || path.join(process.cwd(), "_dist");
let baseurl = cli.flags["b"];
let options = {
    cwd: process.cwd()
};

if (!source) {
    console.log("No source directory specified. Type dist --help for more information.");
    process.exit(1);
}

if (!destination) {
    console.log("No destination directory specified. Type dist --help for more information.");
    process.exit(1);
}

if (!baseurl) {
    console.log("No baseurl specified. Type dist --help for more information.");
    process.exit(1);
}

// Strip leading space
if( destination && destination[0] === ' ') {
  destination = destination.slice(1)
}
if( source && source[0] === ' ') {
  source = source.slice(1)
}

// TODO handle the following:
// $ dist build 
// $ dist serve 
// $ dist watch 

let date = new Date()
let startTime = date.getTime();

runner.build(source, destination, baseurl, options);

let end = new Date();
let elapsedTime = end.getTime() - startTime;
console.log(elapsedTime);
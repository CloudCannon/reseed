const runner = require("../lib/runner.js");
const path = require("path");
const chai = require("chai");
let expect = require('chai').expect;
const fs = require("fs-extra");

let dest = "test/testdir"

let options = {
    cwd: process.cwd(),

    dist: {
        src: "/",
        dest: dest,
        baseurl: "baseurl"
    },
    serve: {
        port: 9000,
        open: true,
        path: "/"
    }            
};
options.dist.fullPathToSource = path.resolve(options.cwd, options.dist.src);
options.dist.fullPathToDest = path.resolve(options.cwd, options.dist.dest, options.dist.baseurl);

describe ("clean", async function() {
    before(function () {
        fs.mkdirSync(dest);
    })

    await context ("Removing a file", function(){
        it("should remove the directory", async function () {
            options.dist.dest = dest;
            let res = await runner.clean( options )
            console.log(res);
            expect(res).to.eql([path.resolve(options.dist.dest)]);
        })
    })

    
    await context ("invalid directory name", function(){
        options.dist.dest = "thisdoesntexist"
        it("should return an empty array", async function () {
            let res = await runner.clean( options )
            expect(res).to.eql([]);
        })
    })

    
    after(function () {
        fs.rmdirSync("test/testdir", {recursive: true})
    })
    
})


describe ("serve", async function() {
    
})
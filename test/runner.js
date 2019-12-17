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


describe ("fetchfiles", function() {

    before(function(){
        fs.mkdirSync("test/forTesting");
        fs.mkdirSync("test/forTesting/assets");
        fs.mkdirSync("test/forTesting/css");
        fs.mkdirSync("test/forTesting/html");
        fs.mkdirSync("test/emptyDir");
        fs.writeFileSync("test/forTesting/image.jpg", "image");
        fs.writeFileSync("test/forTesting/assets/image2.jpg", "image");
        fs.writeFileSync("test/forTesting/style.css", "css");
        fs.writeFileSync("test/forTesting/css/style2.css", "css");
        fs.writeFileSync("test/forTesting/index.html", "html");
        fs.writeFileSync("test/forTesting/html/index2.html", "html");
    })

    context ("type = any", function() {
        it("should retrieve all files", async function() {
            let results = await runner.fetchFiles("test/forTesting", "any");
            expect(results.length).to.equal(6);
        })
    })
    context ("type = css", function() {
        it("should retrieve all files", async function() {
            let results = await runner.fetchFiles("test/forTesting", "css");
            expect(results.length).to.equal(2);
            expect(results.every(file => {
                return path.extname(file) === ".css"
            })).to.equal(true)
        })
    })
    context ("type = html", function() {
        it("should retrieve all files", async function() {
            let results = await runner.fetchFiles("test/forTesting", "html");
            expect(results.length).to.equal(2);
            expect(results.every(file => {
                return path.extname(file) === ".html"
            })).to.equal(true)
        })
    })
    context ("type = assets", function() {
        it("should retrieve all files", async function() {
            let results = await runner.fetchFiles("test/forTesting", "assets");
            expect(results.length).to.equal(2);
            expect(results.every(file => {
                return path.extname(file) === ".jpg"
            })).to.equal(true)
        })
    })

    after(function(){
        fs.rmdirSync("test/forTesting", {recursive: true});
    })
})

describe ("copyfiles", function() {
    
})

describe ("build", function() {
    
})

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

describe ("clone-assets", function() {
    
})


describe ("dist", function() {
    
})


describe ("rewrite-css", function() {
    
})


describe ("rewrite-html", function() {
    
})


describe ("serve", async function() {
    
})

describe ("watch", async function() {
    
})
const runner = require("../lib/runner.js");
const path = require("path");
const chai = require("chai");
let expect = require('chai').expect;
const fs = require("fs-extra");

let dest = "test/testdir"

let options = {
    cwd: "/",

    dist: {
        src: "test/src",
        dest: "test/dest",
        baseurl: "baseurl"
    },
    serve: {
        port: 9000,
        open: true,
        path: "/"
    }            
};
options.dist.fullPathToSource = options.dist.src;
options.dist.fullPathToDest = path.resolve(options.cwd, options.dist.dest, options.dist.baseurl);

let testOp = {
    cwd: "/",

    dist: {
        src: "test/src",
        dest: "test/dest",
        baseurl: "baseurl"
    },
    serve: {
        port: 9000,
        open: true,
        path: "/"
    }            
};
testOp.dist.fullPathToSource = testOp.dist.src;
testOp.dist.fullPathToDest = path.resolve(testOp.dist.dest, "baseurl");


describe ("fetchfiles", function() {

    before(function(){
        fs.mkdirSync("test/forTesting");
        fs.mkdirSync("test/forTesting/assets");
        fs.mkdirSync("test/forTesting/css");
        fs.mkdirSync("test/forTesting/html");
        fs.mkdirSync("test/forTesting/emptyDir/emptierDir", {recursive:true});
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
            expect(results["css"].length).to.equal(2);
            expect(results["other"].length).to.equal(2);
            expect(results["html"].length).to.equal(2);
        })
    })
    context ("type = css", function() {
        it("should retrieve all files", async function() {
            let results = await runner.fetchFiles("test/forTesting", "css");
            expect(results["css"].length).to.equal(2);
            expect(results["css"].every(file => {
                return path.extname(file) === ".css"
            })).to.equal(true)
        })
    })
    context ("type = html", function() {
        it("should retrieve all files", async function() {
            let results = await runner.fetchFiles("test/forTesting", "html");
            expect(results["html"].length).to.equal(2);
            expect(results["html"].every(file => {
                return path.extname(file) === ".html"
            })).to.equal(true)
        })
    })
    context ("type = assets", function() {
        it("should retrieve all files", async function() {
            let results = await runner.fetchFiles("test/forTesting", "assets");
            expect(results["other"].length).to.equal(2);
            expect(results["other"].every(file => {
                return path.extname(file) === ".jpg"
            })).to.equal(true)
        })
    })

    context ("dir doesnt exist", function(){
        it ("should throw an error", async function(){
            let results = await runner.fetchFiles("test/fakeDir");
            expect(results).to.equal(undefined);
            //expect(await function() {runner.fetchFiles("test/fakeDir")}).to.throw();        
        })
    })

    after(function(){
        fs.rmdirSync("test/forTesting", {recursive: true});
    })
})

describe ("copyfiles", function() {
    before(function(){
        fs.mkdirSync("test/src");
        fs.mkdirSync("test/src/assets");
        fs.mkdirSync("test/src/css");
        fs.mkdirSync("test/src/html");
        fs.writeFileSync("test/src/image.jpg", "image");
        fs.writeFileSync("test/src/assets/image2.jpg", "image");
        fs.writeFileSync("test/src/style.css", "css");
        fs.writeFileSync("test/src/css/style2.css", "css");
        fs.writeFileSync("test/src/index.html", "html");
        fs.writeFileSync("test/src/html/index2.html", "html");
    })
    

    

    context("copy files from src to dest", function(){
        it("should return the copied files", async function(){
            let fileList = ["test/src/image.jpg", "test/src/assets/image2.jpg", "test/src/style.css", 
            "test/src/css/style2.css", "test/src/index.html", "test/src/html/index2.html"];
            let results =  await runner.copyFiles(fileList, testOp);
            console.log(results);
            expect(results.length).to.equal(6);

            /*
            let testfile = "test/dest/";
            let file = path.basename(results["other"][0]);
            let filelen = testfile.length + file.length;

            let resFile = results["other"][0];
            expect(resFile.substring(resFile.length - filelen, resFile.length)).to.equal("/"+testfile+file);
            */
        })
    })

    after(function(){
        fs.rmdirSync("test/dest", {recursive: true});
        fs.rmdirSync("test/src", {recursive: true});
    })
    
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
    
    before(function(){
        fs.mkdirSync("test/src");
        fs.mkdirSync("test/src/assets");
        fs.writeFileSync("test/src/image.jpg", "image");
        fs.writeFileSync("test/src/assets/image2.jpg", "image");
    })

    
    context("Cloning from a valid directory", function(){
        
        it("should return the cloned files", async function(){
            let results = await runner.clone_assets(testOp);
            expect(results.length).to.equal(2);
        })
    })
    
    context("Cloning from invalid directory", function(){
        it("should return undefined", async function(){
            options.dist.src = "thisdoesntexist"
            let results = await runner.clone_assets(options);
            expect(results).to.equal(undefined);
        })
    })
    
    
    after(function(){
        fs.rmdirSync("test/dest", {recursive: true});
        fs.rmdirSync("test/src", {recursive: true});
    })
})


describe ("dist", function() {
    
})


describe ("rewrite-css", function() {
    before(function(){
        fs.mkdirSync("test/src");
        fs.mkdirSync("test/src/css");
        fs.writeFileSync("test/src/style.css", "css");
        fs.writeFileSync("test/src/css/style2.css", "css");
    })

    context("Cloning from a valid directory", function(){
        
        it("should return the cloned files", async function(){
            let results = await runner.rewrite_css(testOp);
            expect(results).to.eql([]);
        })
    })
    
    context("Cloning from invalid directory", function(){
        it("should return undefined", async function(){
            options.dist.src = "thisdoesntexist"
            let results = await runner.clone_assets(options);
            expect(results).to.equal(undefined);
        })
    })

    after(function(){
        fs.rmdirSync("test/dest", {recursive: true});
        fs.rmdirSync("test/src", {recursive: true});
    })
})


describe ("rewrite-html", function() {
    before(function(){
        fs.mkdirSync("test/src");
        fs.mkdirSync("test/src/html");
        fs.writeFileSync("test/src/index.html", "html");
        fs.writeFileSync("test/src/html/index2.html", "html");
    })

    context("Cloning from a valid directory", function(){
        
        it("should return the cloned files", async function(){
            let results = await runner.rewrite_html(testOp);
            expect(results).to.eql([]);
        })
    })
    
    context("Cloning from invalid directory", function(){
        it("should return undefined", async function(){
            options.dist.src = "thisdoesntexist"
            let results = await runner.clone_assets(options);
            expect(results).to.equal(undefined);
        })
    })

    after(function(){
        fs.rmdirSync("test/dest", {recursive: true});
        fs.rmdirSync("test/src", {recursive: true});
    })
})


describe ("serve", async function() {
    
})

describe ("watch", async function() {
    
})
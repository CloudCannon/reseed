const cssRewrite = require("../lib/processors/css");
const fs = require("fs-extra");
let expect = require('chai').expect;
let path = require('path');

var filename = "test/testdir";
var dest = "/";
var options = { "baseurl": "baseurl"};


describe("css.js", function() {

    context('No file specified', function() {
        it('should return undefined', function() {
            expect(cssRewrite.plugin("", dest, options)).to.equal(undefined);
        })
    })

    context('No destination specified', function() {
        it('Should return undefined', function(){
            expect(cssRewrite.plugin(filename, "", options)).to.equal(undefined);
        })
    })

    context('No baseurl', function() {
        it('should return 0', function() {
            expect(cssRewrite.plugin(filename, "", null)).to.equal(undefined);
        })
    })

    /*
    context('empty css file', function() {
        it('Should return undefined', functino(){
            expect(cssRewrite())
        })
    })
    */   
})

describe("rewrite css", function(){
    context("css file supplied", function() {
        it("should rewrite the url in file", function(){
            let cssCont = "section.hero { background-image: url(../../testImage.jpg);}" 
            let rewritten = cssRewrite.rewrite(cssCont, "//testcss.css", "testBaseurl");
            console.log(rewritten);
            let testReg = /testBaseurl\/testImage\.jpg/
            expect(testReg.test(rewritten)).to.equal(true);
        })
    })
})

describe("plugin", function(){
    before(function(){
        fs.mkdirSync("test/testdir");
        let testCSS =  "section.hero { background-image: url(../../testImage.jpg); background-size: cover; background-repeat: no-repeat; background-attachment: fixed; text-align: left; margin-top: -100px; padding-top: 250px; }"
        fs.writeFileSync("test/testdir/testcss.css", testCSS);
    })

    context("User supplies a valid css file", function(){
        it("should return 0", function(){
            let file = path.resolve("test/testdir/testcss.css");
            let dest = path.resolve("test/testdir", "testbase");
            expect(cssRewrite.plugin(file, dest, {baseurl:"testbase"})).to.equal(0);
        })
    })


    after(function(){
        fs.rmdirSync("test/testdir", {recursive: true})
    })

})
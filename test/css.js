const cssRewrite = require("../lib/processors/css").plugin;
const fs = require("fs-extra");
let expect = require('chai').expect;

var filename = "test/testdir";
var dest = "/";
var options = { "baseurl": "baseurl"};


describe("css.js", function() {

    before(function(){
        fs.mkdirSync("test/testdir");
        let testCSS = "section.diagonal { -webkit-transform: skewY(-5deg); -moz-transform: skewY(-5deg); -ms-transform: skewY(-5deg); transform: skewY(-5deg); } section.diagonal > div { -webkit-transform: skewY(5deg); -moz-transform: skewY(5deg); -ms-transform: skewY(5deg); transform: skewY(5deg); } section.hero { background-image: url(../../clocktower.jpg); background-size: cover; background-repeat: no-repeat; background-attachment: fixed; text-align: left; margin-top: -100px; padding-top: 250px; } section.hero h2, section.hero p { max-width: 90%; }"     
        fs.writeFileSync("test/testdir/testcss,css", testCSS);
    })

    context('No file specified', function() {
        it('should return undefined', function() {
            expect(cssRewrite("", dest, options)).to.equal(undefined);
        })
    })

    context('No destination specified', function() {
        it('Should return undefined', function(){
            expect(cssRewrite(filename, "", options)).to.equal(undefined);
        })
    })

    context('No baseurl', function() {
        it('should return 0', function() {
            expect(cssRewrite(filename, "", null)).to.equal(undefined);
        })
    })

    /*
    context('empty css file', function() {
        it('Should return undefined', functino(){
            expect(cssRewrite())
        })
    })
    */

    after(function(){
        fs.rmdirSync("test/testdir", {recursive: true})
    })
})
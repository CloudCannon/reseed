const cssRewrite = require("../lib/processors/css").plugin;
const fs = require("fs-extra");
let expect = require('chai').expect;

var filename = "/";
var dest = "/";
var options = { "baseurl": "baseurl"};


describe("css.js", function() {

    before(function(){
        fs.mkdirSync("test/testdir")
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

    after(function(){
        fs.rmdirSync("test/testdir")
    })
})
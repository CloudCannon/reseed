//const rewire = require("rewire");
//const cli = rewire("../cli.js");
const cli = require("../cli");
let expect = require('chai').expect;


/*
cli.__set__({
    process: {
        argv: ["dist", "-b", "test"]
    }
})

console.log("df")
const checkPort = cli.__get__("checkPortNumber");
*/

describe("cli.js", function() {

    context("No port number specified", function() {
        it("should return NaN", function() {
            expect(cli.checkPortNumber( "sfsd")).to.not.equal(Number)
        })
    })
})

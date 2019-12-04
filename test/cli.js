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

describe("checkPortNumber()", function() {

    context("User enters a non-numeric string as port number", function() {
        it("should return undefined", function() {
            expect(cli.checkPortNumber("sfsd")).to.equal(undefined)
        })
    })

    context("User enters an out-of-range port number", function() {
        it("should return undefined", function() {
            expect(cli.checkPortNumber(211)).to.equal(undefined);
        })
        it("should return undefined", function() {
            expect(cli.checkPortNumber(-1231)).to.equal(undefined);
        })
        it("should return undefined", function() {
            expect(cli.checkPortNumber(65536)).to.equal(undefined);
        })
        it("should return undefined", function() {
            expect(cli.checkPortNumber(999999999)).to.equal(undefined);
        })
    })

    context("User enters a valid port number", function() {
        it("should return a number", function() {
            expect(cli.checkPortNumber("8000")).to.equal(8000);
        })
    })

    context("User enters no port number", function() {
        it("should return undefined", function() {
            expect(cli.checkPortNumber()).to.equal(undefined)
        })
    })

})

describe("checkRequiredFlags()", function() {
    context ("User enters correct flag", function() {
        it("should return true", function() {
            expect(cli.checkRequiredFlags(["baseurl"])).to.equal(true);
        })
    })
})
const cli = require("../cli.js");
let expect = require('chai').expect;
let fs = require("fs-extra");

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
    context ("User misses required flag", function() {
        it("Should return false", async function() {
            expect(cli.checkRequiredFlags({}, ["baseurl"])).to.equal(false);
        })
    }) 

    context ("User supplies correct flag", function() {
        it("Should return true", async function() {
            expect(cli.checkRequiredFlags({baseurl: "test"}, ["baseurl"])).to.equal(true);
        })
    }) 
})

describe("setOptions()", function() {
    context ("Receives flags from cli", function() {
        let flags = {"baseurl": "testurl", "port": 9898, "dest": "testdest", "source": "testsource", "overwrite": true}
        it ("should return with the correct flags set", function() {
            let options = cli.setOptions( flags );
            expect(options.dist.baseurl).to.equal("testurl");
            expect(options.serve.port).to.equal(9898);
            expect(options.dist.dest).to.equal("testdest");
            expect(options.dist.src).to.equal("testsource");

            expect(options.flags.split).to.equal(1);
            expect(options.flags.partition).to.equal(1);
        })
    })
})

describe("run()", function() {
    before(function(){
        fs.mkdirSync("test/forTesting");
        fs.writeFileSync("test/forTesting/image.jpg", "image");
    })
    context ("User enters invalid command", function() {
        let inputs = {flags: {}, input: ["invalidcommand"]}
        it ("Should exit with code 1", async function() {
            let exitCode = await cli.run( inputs );
            expect(exitCode).to.equal(1);
        })
    })

    
    context ("User enters valid command", function() {
        
        let inputs = {flags: {"baseurl": "test", "source": "test/forTesting", "dest": "test/forTesting"}, input: ["clone-assets"]}
        it ("Should exit with code (0)", async function() {
            let exitCode = await cli.run( inputs );
            expect(exitCode).to.equal(0);
        })
    })
    
    context ("Command runs but fails", function() {
        let inputs = {flags: {"baseurl": "test", "source": "test/invalidplace", "dest": "test/forTesting"}, input: ["clone-assets"]}
        it("Should exit with code (1)", async function() {
            let exitCode = await cli.run( inputs );
            expect(exitCode).to.equal(1);
        })
    })

    context ("User misses required flag", function() {
        let inputs = {flags: {}, input: ["build"]}
        it ("Should exit with code 1", async function() {
            let exitCode = await cli.run( inputs );
            expect(exitCode).to.equal(1);
        })
    })

    after(function(){
        fs.rmdirSync("test/forTesting", {recursive: true})
    })
})
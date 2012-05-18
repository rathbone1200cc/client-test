#!/usr/local/bin/node
var clientTest = require("./lib/clientTest.js"),
    assert = require("assert")
console.log("hello, I'm running tests")
console.log(process.argv)
assert.ok(process.argv.length === 3, "usage: run-tests.js <input file>")
clientTest.run(process.argv[2], function(){console.log("done with test")})

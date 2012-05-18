#!/usr/local/bin/node
var clientTest = require("./lib/clientTest.js"),
    assert = require("assert")
assert.ok(process.argv.length === 3, "usage: run-tests.js <input file>")
console.log("hello, I'm running tests")
clientTest.run(process.argv[2], function(){console.log("done with test")})

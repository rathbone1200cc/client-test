#!/usr/local/bin/node
var clientTest = require("./lib/clientTest.js"),
    assert = require("assert")
console.log("hello, I'm running tests")
console.log(process.argv)
var usage = "usage: run-tests.js <input file> <concurrency> <total requests>"
assert.ok(process.argv.length === 5, usage)
var options = {concurrency:parseInt(process.argv[3]), totalRequests:parseInt(process.argv[4])}
clientTest.run(process.argv[2], options, function(){console.log("done with test")})

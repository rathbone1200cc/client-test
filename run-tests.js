#!/usr/local/bin/node
var request_urls = require("./lib/request_urls.js"),
    assert = require("assert")
assert.ok(process.argv.length === 3, "usage: run-tests.js <input file>")
console.log("hello, I'm running tests")
request_urls.run(function(){console.log("done with test")})

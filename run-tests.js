#!/usr/local/bin/node
var request_urls = require("./lib/request_urls.js")
console.log("hello, I'm running tests")
request_urls.run(function(){console.log("done with test")})

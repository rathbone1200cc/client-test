var fs    = require("fs")


var tests = []

// Very basic JSON-based test generator 
// Useful for replaying repro logs
// Might be useful to extend this or build a streaming JSON test generator in the future

exports.init = function(context) {
  tests = JSON.parse(fs.readFileSync(context.inputFile))
  console.log("jsonTestGenerator loaded " + tests.length + " tests.")
}

exports.getNextTests = function() {
  return tests
}

exports.hasNextTests = function() {
  return true
}
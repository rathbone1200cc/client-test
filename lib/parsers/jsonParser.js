var fs    = require("fs")


var tests = []

// Very basic JSON parser
// Useful for replaying repro logs
// Might be useful to extend this or build a streaming JSON parser in the future

exports.init = function(context) {
  tests = JSON.parse(fs.readFileSync(context.inputFile))
  console.log("jsonParser loaded " + tests.length + " tests.")
}

exports.nextTests = function() {
  return tests
}

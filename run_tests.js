#!/usr/bin/env node

var program = require('commander'),
    runner = require('./lib/clientTest.js'),
    customAssert = require("./src/assert.js")

program
  .version('0.0.1')
  .usage('[options] <hostname ...>')
  .option('--input <file>', 'Use defaultParser (line-by-line URLs) to parse the input file')
  .option('--soql <file>', 'use soqlParser to parse the input file')
  .option('--hydra <file>', 'Use hydraParser to parse the input file')
  .option('-d, --driver <driver>', 'Driver to use: <node|phantom>')
  .option('-c, --concurrency <count>', 'Number of concurrent requests')
  .option('-n, --requests <count>', 'Total number of requests')
  .option('--compare <assertion>', 'Comparison to perform on results: <count|identifiers|fields|full>')
  .parse(process.argv);


var parserName, inputFile;
if(program.soql) {
	parserName = "soqlParser"
	inputFile = program.soql
} else if(program.hydra) {
	paser = "hydraParser"
	inputFile = program.hydra
} else if(program.urls) {
	parserName = "defaultParser"
	inputFile = program.input
}

var parser = require("./src/parsers/" + parserName + ".js")
var tests = parser.makeTests(inputFile)


var options = {}
options.hostnames = program.args || "https://opendata.test-socrata.com"
options.driver = program.driver || "nodeRequest"
options.compare = [customAssert.getComparator(program.compare)] || undefined
options.concurrency = program.concurrency || 1
options.totalRequests = program.requests || tests.length

console.log("Command line args:")
console.log("\tparserName:\t" + parserName)
console.log("\tinputFile:\t" + inputFile)
console.log("\toptions:\t" + JSON.stringify(options))
console.log("------------------------------------")

runner.addTests( tests )
runner.run( options, function() { console.log("El fin.") })
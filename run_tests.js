#!/usr/bin/env node

var program = require('commander'),
    clientTest = require('./lib/clientTest.js'),
    customAssert = require("./src/assert.js")

program
  .version('0.0.1')
  .usage('[options] <hostname ...>')
  .usage('[options] <hostname ...>')
  .option('--input <file>', 'Use defaultParser (line-by-line URLs) to parse the input file')
  .option('--soql <file>', 'use soqlParser to parse the input file')
  .option('--hydra <file>', 'Use hydraParser to parse the input file')
  .option('--json <file>', 'Use jsonParser to parse the input file')
  .option('-d, --driver <driver>', 'Driver to use: <node|phantom>')
  .option('-c, --concurrency <count>', 'Number of concurrent requests')
  .option('-n, --requests <count>', 'Total number of requests')
  .option('--compare <assertion>', 'Comparison to perform on results: <count|identifiers|fields|full>')
  .option('--repro <filename>', 'Creates a log of runtime test definitions that can be rerun for reproducibility')
  .on('--help', function() {
    console.log("  Examples:")
    console.log("    $ ./run-tests.js -c 5 -n 100 --soql input/soql_sample.csv https://opendata.test-socrata.com")
    console.log("    $ ./run-tests.js -c 5 -n 100 --driver phantom --soq input/staging-html.csv https://opendata.test-socrata.com")
    console.log("    $ ./run-tests.js --compare count --soql input/soql_sample.csv https://opendata.test-socrata.com http://localhost:9292")
    console.log("")
  })
  .parse(process.argv);


var parserName, inputFile;
if(program.soql) {
	parserName = "soqlParser"
	inputFile = program.soql
} else if(program.hydra) {
	parserName = "hydraParser"
	inputFile = program.hydra
} else if(program.input) {
	parserName = "defaultParser"
	inputFile = program.input
} else if(program.json) {
  parserName = "jsonParser"
  inputFile = program.json
} else {
  console.log("  Must specify a parser.")
  program.help()
}


//var parser = require("./src/parsers/" + parserName + ".js")
// var hostnames = program.args || "UNDEFINED_HOSTNAME"
//var tests = parser.makeTests(inputFile, hostnames)


var options = {}

options.defaultTestDefinition = {
  driver : program.driver || "nodeRequest",
  compare : program.compare ? [program.compare] : undefined
}

options.parserContext = {
  parserName : parserName,
  hostnames : program.args || "UNDEFINED_HOSTNAME",
  inputFile : inputFile,
}

//options.driver = program.driver || "nodeRequest"
//options.compare = program.compare ?[customAssert.getComparator(program.compare)] : undefined
options.concurrency = program.concurrency || 1
options.totalRequests = program.requests || tests.length
options.reproLog = program.repro || undefined

console.log("Command line args:")
console.log("\toptions:\t" + JSON.stringify(options))
console.log("------------------------------------")



clientTest.registerAssertion('rowCount', customAssert.getAssertion('rowCount'))
clientTest.registerAssertion('resultShape', customAssert.getAssertion('resultShape'))
clientTest.registerComparator('resultsMatch', customAssert.getComparator('resultsMatch'))
clientTest.registerComparator('rowCountsMatch', customAssert.getComparator('rowCountsMatch'))

clientTest.run( options, function() { console.log("Finished testing.") })
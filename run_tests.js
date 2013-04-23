#!/usr/bin/env node

var program = require('commander'),
    clientTest = require('./lib/clientTest.js')

program
  .version('0.0.1')
  .usage('[options] <hostname ...>')
  .usage('[options] <hostname ...>')
  .option('--input <file>', 'Use defaultTestGenerator (line-by-line URLs) to parse the input file')
  .option('--rath <file>', 'use rathTestGenerator to parse the input file')
  .option('--hydra <file>', 'Use hydraTestGenerator to parse the input file')
  .option('--json <file>', 'Use jsonTestGenerator to parse the input file')
  .option('-d, --driver <driver>', 'Driver to use: <node|phantom>')
  .option('-c, --concurrency <count>', 'Number of concurrent requests')
  .option('-n, --requests <count>', 'Total number of requests')
  .option('--compare <assertion>', 'Comparison to perform on results: <count|identifiers|fields|full>')
  .option('--repro <filename>', 'Creates a log of runtime test definitions that can be rerun for reproducibility')
  .on('--help', function() {
    console.log("  Examples:")
    console.log("    $ ./run-tests.js -c 5 -n 100 --rath input/soql_sample.csv https://opendata.test-socrata.com")
    console.log("    $ ./run-tests.js -c 5 -n 100 --driver phantom --soq input/staging-html.csv https://opendata.test-socrata.com")
    console.log("    $ ./run-tests.js --compare count --rath input/soql_sample.csv https://opendata.test-socrata.com http://localhost:9292")
    console.log("")
  })
  .parse(process.argv);


var generatorName, inputFile;
if(program.rath) {
  require('./src/generators/rathTestGenerator.js').register()
	generatorName = "rathTestGenerator"
	inputFile = program.rath
} else if(program.hydra) {
  require('./src/generators/hydraTestGenerator.js').register()
	generatorName = "hydraTestGenerator"
	inputFile = program.hydra
} else if(program.input) {
	generatorName = "defaultTestGenerator"
	inputFile = program.input
} else if(program.json) {
  generatorName = "jsonTestGenerator"
  inputFile = program.json
} else {
  console.log("  Must specify a test generator.")
  program.help()
}


var options = {}

options.defaultTestDefinition = {
  driver : program.driver || "nodeRequest",
  compare : program.compare ? [program.compare] : undefined
}

options.generatorContext = {
  name : generatorName,
  hostnames : program.args || "UNDEFINED_HOSTNAME",
  inputFile : inputFile,
}

options.concurrency = program.concurrency || 1
options.totalRequests = program.requests || tests.length
options.reproLog = program.repro || undefined

console.log("Running with options:")
console.log(options)
console.log("------------------------------------")


clientTest.run( options, function() { console.log("Finished testing.") })
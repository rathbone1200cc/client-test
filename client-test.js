var
util = require('util'),
control = require('./lib/control'),
driver = require('./lib/prototypes/driver'),
generator = require('./lib/prototypes/generator'),
csvGenerator = require('./lib/generators/csv'),
program = require('commander')
;

var 
log = console.log,
inspect = function(obj){log(util.inspect(obj));}
;

module.exports = function(dmod){

  program
  .version('0.1.0')
  .option('-c --concurrency <integer>', 'test concurrency (default 1)', parseInt)
  .option('-n, --number <integer>', 'number of tests (default to number of tests input)')
  ;

  var d = driver(dmod),
  driver_options = d.options();

  for (i in driver_options){
    var dopt = dopts[i];
    program.option(dopt.option, dopt.description);
  }

  var g = generator(csvGenerator)
  generator_options = g.options();

  for (j in generator_options){
    var gopt = generator_options[j];
    program.option(gopt.option, gopt.description);
  }


  program.parse(process.argv);
  inspect(program);

  var suite = {
    options: program,
    generator: g,
    driver: d
  }

  g.input('input/sample.csv');

  control.runSuite(suite);
}



var
util = require('util'),
fs = require('fs'),
control = require('./lib/control'),
driver = require('./lib/prototypes/driver'),
generator = require('./lib/prototypes/generator'),
program = require('commander')
_ = require('lodash')
;

var 
log = console.log,
inspect = function(obj){log(util.inspect(obj, {depth:null, colors:true}));}
;

var drivers = {
  http: require("./lib/drivers/nodeHttp")
}

exports.addDriver = function(dname, dmod){
  drivers[dname] = dmod;
  return exports;
}



exports.run = function(){

  program
  .version('0.1.0')
  .usage("[client-test-options] <command> [options]")
  .option('-c, --concurrency <integer>', 'test concurrency (default 1)', parseInt)
  .option('-n, --number <integer>', 'number of tests (default to number of tests input)')
  .option('-g, --generator <path>', 'path to test generator script. Must be a node module')
  .option('-i, --input <path>', 'input file for test generator script.')
  .option('-s, --suite <path>', 'suite options and variations that override test options')
  .option("-p, --performance", "log response performance metrics")
  .option("-h, --host <hostname>", "host domain or IP address")
  .option("-a, --assert <assertion[:expected]>", "verify response with named assertion (and expectation)")
  .on("--help", function(){
    log('  For command-specific options, run: ' + program._name + ' <command> --help');
    log('');
    log('  Examples:');
    log('');
    log('    ./' + program._name + ' --help         # output this help text');
    log('    ./' + program._name + ' http --help    # output help for the http driver');
    log('');
    log('    ./' + program._name + ' -i ./input/sample.csv -g ./lib/generators/csv.js -n 1000 -c 16 http -p');
    log('');
    log('                                # read file sample.csv');
    log('                                # through "csv" test generator');
    log('                                # run a total of 1000 tests');
    log('                                # run 16 tests at a time');
    log('                                # and log the http response performance');
    log('');
  })
  ;

  _.each(drivers, function(dmod, command){
    var d = driver(dmod);
    var subcommand = program.command(command);
    for (t in d.options){
      subcommand.option(d.options[t].option, d.options[t].description);
    }
    subcommand.action(function (options){
      startRuns(d, options);
    });
    subcommand.on("--help", function (){
      if (d.examples){
        log('  Examples:');
        log('');
        for (e in d.examples){
          log('    ' + command + ' ' + d.examples[e]);
        }
        log('');
      }
    });
  });

  program.parse(process.argv);
  if (program.args.length === 0) program.help();
  else if (program.args.length === 1 && "string" === typeof(program.args[0])){
    log("");
    log("  ERROR: unrecognized command '" + program.args[0] + "'");
    log("    you can extend client-test with http drivers to add a command");
    program.help();
  }
}

function startRuns(driver, driverOptions){
  var variations = makeVariations(driver, driverOptions);
  control.runSuites(variations, function(){
    log("testing complete");
  });
}

function makeVariations(driver, driverOptions){
  var program = driverOptions.parent;
  function sliceOption(opt){return opt.long.slice(2)};
  var allOptions = _.map(program.options, sliceOption).concat(_.map(driverOptions.options, sliceOption));
  //inspect(allOptions);
  var suiteSpec = program.suite ? JSON.parse(fs.readFileSync(program.suite)) : {};
  var variations = exports.explode({}, suiteSpec.variations);
  var suites = _.map(variations, function(variation){
    gpath = program.generator || variation.generator || './lib/generators/urls'
    var gmod = require( gpath );
    var g = generator(gmod);
    var suite = {
      options: _.assign( _.pick(variation, allOptions), _.pick(driverOptions,allOptions), _.pick(program, allOptions)),
      generator: g,
      input: program.input || './input/urls.txt',
      driver: driver,
      driverOptions: _.pick(driverOptions, allOptions)
    }
    //inspect(suite);
    return suite;
  });
  return suites;
}

exports.explode = function(base, variations){
  var exploded = [base || {}];
  _.each(variations, function (values, option){
    var acc = [];
    _.each(values, function(value){
      var dup = _.cloneDeep(exploded);
      _.each(dup, function(d){
        d[option] = value;
        acc.push(d);
      });
    });
    exploded = acc;
  });
  return exploded;
}

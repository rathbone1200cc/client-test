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
  .option('-c --concurrency <integer>', 'test concurrency (default 1)', parseInt)
  .option('-n, --number <integer>', 'number of tests (default to number of tests input)')
  .option('-g, --generator <path>', 'path to test generator script. Must be a node module')
  .option('-i, --input <path>', 'input file for test generator script.')
  .on("--help", function(){
    debugger;
    log('  For command-specific options, run: ' + program._name + ' <command> --help');
    log('');
    log('  Examples:');
    log('');
    log('    ./' + program._name + ' --help         # output this help text');
    log('    ./' + program._name + ' http --help    # output help for the http driver');
    log('');
    log('    ./' + program._name + ' -i sample.csv -g csv -n 1000 -c 16 http -p');
    log('                                # read file sample.csv');
    log('                                # through "csv" test generator');
    log('                                # run a total of 1000 tests');
    log('                                # run 16 tests at a time');
    log('                                # and log the http response performance');
    log('');
  })
  ;

  var d, subcommand;
  for (c in drivers){
    d = driver(drivers[c]);
    subcommand = program.command(c);
    for (t in d.options){
      subcommand.option(d.options[t].option, d.options[t].description);
    }
    subcommand.action(function (options){
      debugger;
    });
    subcommand.on("--help", function (){
    });
  }

  var g = generator(csvGenerator);
  //for (j in g.options){ program.option(g.options[j].option, g.options[j].description); }

  program.parse(process.argv);
  inspect(program);

  var suite = {
    options: program,
    generator: g,
    driver: d
  }

  //g.input('input/sample.csv');

  control.runSuite(suite);
}



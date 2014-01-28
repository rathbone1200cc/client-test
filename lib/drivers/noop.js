var
util = require('util')
nodeHttp = require('./nodeHttp')
;

/*
 * As the NOOP name suggests, I don't actually run a test.
 * I do, however, print the test options
 */
exports.run = function(test, stopwatch, callback){
  console.log("LOL I'm the NO-OP driver. Here are my options: ");
  console.log(util.inspect(test, {colors:true}));
  process.nextTick(callback);
}

exports.timings = [];
exports.options = nodeHttp.options;
exports.examples = function(){ return []; }

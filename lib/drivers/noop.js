var
util = require('util')
nodeHttp = require('./nodeHttp')
;

/*
 * As the NOOP name suggests, I don't actually run a test.
 * I do, however, print the test options
 */
exports.run = function(test, callback){
  console.log("LOL I'm the NO-OP driver");
  console.log(util.inspect(test, {colors:true}));
  callback();
}

exports.options = nodeHttp.options;

exports.examples = function(){
  return [
  ]
}

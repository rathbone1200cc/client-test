var
async = require('async')
;

var
log = console.log,
inspect = function(obj){log(util.inspect(obj, {depth:null, colors:true}));}
;

exports.runSuite = function(suite, callback){
  var 
  submitted = 0,
  q = async.queue(suite.driver.drive, suite.options.concurrency || 1)
  ;

  function kick(){
    var t = suite.generator.nextTest();
    if (t && submitted < suite.options.number || 1){ q.push(t); }
  }

  q.drain = function(){"suite complete"}
  q.empty = kick;
  suite.generator.on("tests", kick);
};

exports.normalize = function(test, suite, run){

}

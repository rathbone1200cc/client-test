var
async = require('async')
;

exports.runSuite = function(suite){
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

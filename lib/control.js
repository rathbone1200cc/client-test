var
async = require('async')
;

var
log = console.log,
inspect = function(obj){log(util.inspect(obj, {depth:null, colors:true}));}
;

exports.runSuite = function(suite, callback){
  debugger;
  var 
  submitted = 0,
  max = suite.options.number,
  calledBack = false,
  q = async.queue(suite.driver.drive, suite.options.concurrency || 1)
  ;

  function kick(){
    var t = suite.generator.nextTest();
    if (t && (!max || submitted < max)){ 
      submitted++;
      q.push(t); 
    }
  }

  q.drain = function(){
    if (!calledBack && (!max || submitted >= max)) {
      log("suite complete");
      callback();
      calledBack = true;
    }
  }
  q.empty = kick;
  suite.generator.on("tests", kick);
  suite.generator.input(suite.input);
};

exports.normalize = function(test, suite, run){

}

exports.runSuites = function(suites, callback){
  async.forEachSeries(suites, exports.runSuite, callback);
}

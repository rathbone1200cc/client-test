var
async = require('async')
,_ = require('lodash')
,perfLog = require('./loggers/performance')
;

var
log = console.log,
inspect = function(obj){log(util.inspect(obj, {depth:null, colors:true}));},
noinit = function(suite, callback){callback();}
;

exports.runSuite = function(suite, callback){
  var 
  submitted = 0,
  max = suite.options.number,
  calledBack = false,
  q = async.queue(suite.driver.drive, suite.options.concurrency || 1)
  ;

  function kick(){
    var t = suite.generator.nextTest();
    if (t && (!max || submitted < max)){ 
      var test = _.assign(t, suite.options);
      submitted++;
      q.push(test);
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
  //suite.driver.init = suite.driver.init || noinit;
  exports.initSuite(suite, function(err){
    suite.generator.input(suite.input);
  });
};

exports.runSuites = function(suites, callback){
  async.forEachSeries(suites, exports.runSuite, callback);
}

exports.initSuite = function(suite, callback){
  perfLog.initSuite(suite);
  callback();
}

var
assert = require('assert')
,fs = require('fs')
,perfLog = require('../loggers/performance')
;

var log = console.log;

module.exports = function(client){
  assert.equal(typeof(client.run), 'function', "client must define run method");
  var options = client.options();
  var examples = client.examples();
  assert.equal(typeof(options), 'object', "client must define options method which returns array");

  var d = {
    client: client,
    options: options,
    examples: examples,
    timings: client.timings,
    drive: function(test, callback){
      log("driver starting test");
      var stopwatch = exports.makeStopwatch();
      d.client.run(test, stopwatch, function(err, result){
        stopwatch("end");
        log("driver done with test");
        callback();
        exports.report(err, test, stopwatch.times, result);
      });
    }
  }
  return d;
}

function timeMS(){ return new Date().getTime();}
exports.makeStopwatch = function(){
  var start = timeMS();
  var times = {start:start};
  var stopwatch = function(tag){ times[tag] = timeMS() - start; }
  stopwatch.times = times;
  return stopwatch;
}

exports.report = function(err, test, times, result){
  /*
  if (test.logResponse) {
    var outputFile = "output/response_content/" 
      + encodeURIComponent(test.url) + new Date().getTime() + ".txt"
    fs.writeFile(outputFile, body)
  }
  */
  if (test.verbose){ log(result.body); }
  if (test.performance){ perfLog.logResult(err, test, times, result); }
}

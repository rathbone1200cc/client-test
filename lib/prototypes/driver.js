var
assert = require('assert')
,clientAsserts = require('../assert')
,fs = require('fs')
,url = require('url')
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
      exports.normalize(test);
      d.client.run(test, stopwatch, function(err, result){
        if (!err && test.assert) err = exports.assert(test, stopwatch.times, result);
        stopwatch("end");
        log("driver done with test");
        if (err) log(err);
        callback(); // don't send the err in the callback, as this could stop the test suite execution.
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

exports.assert = function(test, times, result){
  try { 
    var assertParts = test.assert.split(":");
    assert(assertParts.length > 0);
    var clientAssert = clientAsserts[assertParts[0]];
    assertParts[0] = result;
    clientAssert.apply(null, assertParts);
  }
  catch (err){ return err; }
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

/*
 * This is a shim to support older test generators.
 */
exports.normalize = function(test){
  if (!test.url){
    test.url = "http://" + test.host + test.inputPath;
  }

  if (test.assert && typeof( test.assert ) === 'object'){
    arr = [];
    for (a in test.assert){
      var oldAssert = test.assert[a];
      var newAssert = oldAssert.check;
      if (oldAssert.expect) newAssert += (":" + oldAssert.expect);
      arr.push(newAssert);
    }
    test.assert = arr.join(",");
  }
}

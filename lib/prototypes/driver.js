var
assert = require('assert')
,fs = require('fs')
;

var log = console.log;
var perfReport = fs.createWriteStream( "output/performance/responseTimes.tsv", { flags: 'a'});

module.exports = function(client){
  assert.equal(typeof(client.run), 'function', "client must define run method");
  var options = client.options();
  var examples = client.examples();
  assert.equal(typeof(options), 'object', "client must define options method which returns array");

  var d = {
    client: client,
    options: options,
    examples: examples,
    drive: function(test, callback){
      log("driver starting test");
      var stopwatch = exports.makeStopwatch();
      d.client.run(test, stopwatch, function(err, results){
        log("driver done with test");
        if (err) return callback(err);
        else {
          debugger;
          callback();
          //exports.report(test, stopwatch, results);
        }
      });
    }
  }
  return d;
}

function timeMS(){ return new Date().getTime();}
exports.makeStopwatch = function(){
  var start = timeMS();
  var times = {};
  var stopwatch = function(tag){ times[tag] = timeMS() - start; }
  stopwatch.times = times;
  return stopwatch;
}

exports.report = function(test, times, results){
  if (test.logResponse) {
    var outputFile = "output/response_content/" 
      + encodeURIComponent(test.url) + new Date().getTime() + ".txt"
    fs.writeFile(outputFile, body)
  }
  if (test.verbose){ log(body); }
  if (test.performance){
    var keys = time.keys()
    if (firstRun) {
      var columnTitles = time.keys()
      columnTitles.push('response_time')
      columnTitles.push('content_length')
      columnTitles.push('response_code')
      columnTitles.push('url')
      if (test.tag) columnTitles.push('tag')
      loggers.responsePerfFile.write(columnTitles.join('\t'))
      loggers.responsePerfFile.write('\n')
      firstRun = false
    }
    for (key in keys) {
      loggers.responsePerfFile.write(time.clock(keys[key]) + '\t')
    }
    loggers.responsePerfFile.write(responseTime + '\t')
    loggers.responsePerfFile.write(body.length + '\t')
    loggers.responsePerfFile.write(response.statusCode + '\t')
    loggers.responsePerfFile.write(test.url + '\t')
    if (test.tag) loggers.responsePerfFile.write(test.tag)
    loggers.responsePerfFile.write('\n')
  }
}

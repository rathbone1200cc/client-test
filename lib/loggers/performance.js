
var 
fs = require('fs')
;

var stream = fs.createWriteStream( "output/performance/responseTimes.tsv", { flags: 'a'});

var c1 = ['test_start', 'test_end'];
var driverTimings;
var c2 = ['error', 'status_code', 'content_length', 'tag', 'url'];
var columns = [];

exports.initSuite = function(suite){
  driverTimings = suite.driver.timings || [];
  columns = [].concat(c1, driverTimings, c2);
  logLine([]);
  logLine(columns);
}

exports.logResult = function(err, test, times, result){
  var r1 = [times.start, times.end];
  var dt = [];
  for (t in driverTimings){ dt.push(times[driverTimings[t]]);}
  var r2 = [];
  result = result || {};
  r2.push(err ? err.toString() : "");
  r2.push(result.statusCode || "");
  r2.push(result.body ? result.body.length : "");
  r2.push(test.tag || "");
  r2.push(test.url);
  logLine([].concat(r1, dt, r2));
}

function logLine (values){
  stream.write(values.join('\t'));
  stream.write('\n');
}

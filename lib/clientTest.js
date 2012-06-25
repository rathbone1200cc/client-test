var fs    = require("fs"),
    _     = require("underscore"),
    _s    = require("underscore.string"),
    _a = require("async"),
    assert= require("assert"),
    nodeRequest = require("./nodeRequest.js"),
    phantomDriver = require("./phantomDriver.js")

exports.makeTimeLog = function(){
  var times = {}
  function log_time(key){ times[key] = new Date().getTime() }
  log_time("start")
  return {
    log:log_time,
    clock:        function(k)  {return times[k]},
    fromStart:    function(k)  {return times[k] - times["start"]},
    diff:         function(f,s){return times[s] - times[f]},
    keys:         function(){return _.keys(times)}
  }
}

exports.planTest = function(line){
  var options = {}
  var args = line.split('\t')
  options.testUrl = args[0]
  //_.each(args, function(arg){
  var i = 0;
  function consume(){var arg = args[i]; i++; return _s.trim(arg);} while (i < args.length){
    var arg = consume()
    switch (arg) {
      case 'consoleResponse':
        options.consoleResponse = true
        break;
      case 'encodeQuery':
        var query = consume()
        options.testUrl += '?$query=' + encodeURIComponent(query)
        break;
      case 'outputResponse': 
        options.outputResponse = true
        options.nodeRequest = true
        break;
      case 'responsePerf':
        options.responsePerf = true
        options.nodeRequest = true
        break;
      case 'assert':
        if ( !options.assert ) { options.assert = [] }
        var assertion = {check:consume(), expecting:eval(consume())}
        options.assert.push(assertion)
        options.nodeRequest = true
        break;
      case 'renderPage':
        options.renderPage = true
        options.loadDom = true
        break;
      case 'domPerf':
        options.domPerf = true
        options.loadDom = true
        break;
      case 'domContent':
        options.domContent = true
        options.loadDom = true
        break;
      case 'disabled':
        options.disabled = true
    }
  }
  console.log(options)
  return options
}

exports.runTest = function(testOptions, callback){
  var time = exports.makeTimeLog()
  var drivers = [nodeRequest, phantomDriver]
  function run(driver,cb){ driver.run(testOptions, exports.runOptions, time, cb) }
  _a.forEachSeries(drivers, run, callback)
}

exports.makeTests = function(file){
  var lines = fs.readFileSync(file).toString().split('\n')
  var lines_filtered = _.filter(lines,function(line){return line.length > 0})
  var options = _.map(lines_filtered, function(line){return exports.planTest(line)})
  var options_filtered = _.filter(options, function(testOptions){ return !testOptions.disabled})
  var tests = _.map(options_filtered, function(testOptions){
    var test = function(callback){exports.runTest(testOptions, callback)}
    //test.description = line
    return test
  })
  console.log(tests)
  return tests;
}

exports.run = function(file, options, callback){
  exports.runOptions = options;
  exports.runOptions.testsStarted = 0
  exports.runOptions.responsePerfFile = fs.createWriteStream(
    "output/perf/responsePerf.tsv",
    { flags: 'a'}
  )
  exports.runOptions.domPerfFile = fs.createWriteStream(
    "output/perf/domPerf.tsv",
    { flags: 'a'}
  )
  var tests = exports.makeTests(file)
  var indexNextTest = 0;
  var concurrency = options.concurrency || 1
  var q = _a.queue(function(test, callback){
    exports.runOptions.testsStarted++;
    test(callback)
  }, concurrency)
  q.empty = function(){
    if (exports.runOptions.testsStarted < exports.runOptions.totalRequests) {
      q.push(tests[indexNextTest]);
      indexNextTest = (indexNextTest + 1) % tests.length;
    }
  }
  q.drain = function(){callback()}
  q.push(tests)
}


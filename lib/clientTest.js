var fs    = require("fs"),
    _     = require("underscore"),
    _s    = require("underscore.string"),
    nodeRequest = require("./nodeRequest.js"),
    phantomDriver = require("./phantomDriver.js"),
    _a = require("async")

exports.makeTimeLog = function(){
  var times = {}
  function log_time(key){ times[key] = new Date().getTime() }
  log_time("start")
  return {
    log:log_time,
    clock:          function(k)  {return times[k] - times["start"]},
    diff:         function(f,s){return times[s] - times[f]}
  }
}

exports.planTest = function(line){
  var options = {}
  var args = line.split('\t')
  options.testUrl = args[0]
  //_.each(args, function(arg){
  var i = 0;
  function consume(){var arg = args[i]; i++; return _s.trim(arg);}
  while (i < args.length){
    var arg = consume()
    switch (arg) {
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
    }
  }
  console.log(options)
  return options
}

exports.runTest = function(testDef, callback){
  var options = exports.planTest(testDef)
  var time = exports.makeTimeLog()
  var drivers = [nodeRequest, phantomDriver]
  function run(driver,cb){ driver.run(options.testUrl, options, time, cb) }
  _a.forEachSeries(drivers, run, callback)
}

exports.makeTests = function(file){
  var lines = fs.readFileSync(file).toString().split('\n').reverse()
  var lines_filtered = _.filter(lines,function(line){return line.length > 0})
  var tests = _.map(lines_filtered, function(line){
    var test = function(callback){exports.runTest(line, callback)}
    test.description = line
    return test
  })
  return tests;
}

exports.run = function(file, options, callback){
  var tests = exports.makeTests(file)
  var concurrency = options.concurrency || 1
  var q = _a.queue(function(test, callback){
    test(callback)
  }, concurrency)
  q.drain = function(){callback()}
  q.push(tests)
}


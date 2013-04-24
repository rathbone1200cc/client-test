var fs    = require("fs"),
    _     = require("underscore"),
    async = require("async"),
    assert= require('assert'),
    registration = require('./registration.js')



exports.makeTimeLog = function(){
  var times = {}
  function log_time(key){ times[key] = new Date().getTime() }
  log_time("start")
  return {
    log:          log_time,
    clock:        function(k)  { return times[k] },
    fromStart:    function(k)  { return times[k] - times["start"] },
    diff:         function(f,s){ return times[s] - times[f] },
    keys:         function()   { return _.keys(times) }
  }
}


var _firstTestDefinition = true
exports.runTest = function(testDefinition, callback) {
  var time = exports.makeTimeLog()
  var runtimeDefinition = _.extend({}, exports.runOptions.defaultTestDefinition, testDefinition)

  // We're being really flexible here:
  //   testUrl or testUrls
  //   string or array of strings or function returning either a string or an array of strings
  //   a single string can even be multiple URLs, semicolon-delimited
  // As long as we end up with an array of URL strings, we're good
  var testUrls = runtimeDefinition.testUrls || runtimeDefinition.testUrl
  testUrls = (_.isFunction(runtimeDefinition.testUrls)) ? runtimeDefinition.testUrls() : runtimeDefinition.testUrls
  if(_.isString(runtimeDefinition.testUrls)) { 
    testUrls = testUrls.split(';')
  }
  delete runtimeDefinition.testUrl
  runtimeDefinition.testUrls = testUrls

  // Now we can serialize runtimeDefinition to the repro log
  // console.log(runtimeDefinition)
  if(exports.loggers.reproLog) {
    var reproLine = "  " + JSON.stringify(runtimeDefinition)
    if(_firstTestDefinition) {
      _firstTestDefinition = false
    } else {
      reproLine = ",\n" + reproLine
    }
    exports.loggers.reproLog.write(reproLine)
  }


  var driver = registration.getDriver(runtimeDefinition.driver)

  var endpointTasks = _.map( testUrls, function(url) { 
    return function(cb) {
      driver.run(url, runtimeDefinition, time, exports.loggers, function(response) {

        // Handle response assertions
        _.each(runtimeDefinition.assert, function(a) { 
          // console.log("Asserting '" + a.check + "' - expecting: " + a.expect)
          registration.getAssertion(a.check)(response, a.expect) 
        })
        
        cb(null, response)
      })

    }
  })


  async.parallel( endpointTasks, function(err, results) {
      // Compare results from multiple endpoints
      if( results.length > 1 ) {
        _.each(runtimeDefinition.compare, function(c){ 
          registration.getComparator(c)(results) 
        })      
      } 
      
      callback()
  })
}



exports.run = function(options, callback){
  exports.runOptions = options;
  exports.loggers = {};

  exports.loggers.responsePerfFile = fs.createWriteStream(
    "output/perf/responsePerf.tsv",
    { flags: 'a'}
  )
  exports.loggers.domPerfFile = fs.createWriteStream(
    "output/perf/domPerf.tsv",
    { flags: 'a'}
  )

  if(options.reproLog) {
    exports.loggers.reproLog = fs.createWriteStream(
      options.reproLog,
      { flags: 'w+' }
    )
    exports.loggers.reproLog.write('[\n')
  }

  var generator = registration.getGenerator(options.generatorContext.name)
  generator.init(options.generatorContext)

  var testsStarted = 0
  var concurrency = options.concurrency || 1
  var q = async.queue( function(test, callback) { 
    try {
      exports.runTest(test, callback)
    } catch(e) {
      console.log("EXCEPTION during test:")
      console.log(test)
      console.log(e)
    }
  }, concurrency )

  q.empty = function(){
    console.log('already started: ' + testsStarted)
    console.log('test limit: ' + exports.runOptions.totalRequests)
    var testsRemaining = exports.runOptions.totalRequests - testsStarted
    if (testsRemaining > 0) {
      var nextTests = _.first(generator.nextTests(), testsRemaining)
      nextTests = _.map(nextTests, function(test) { 
        // I'm not carrying around a bag of junk properties just cuz your generator doesn't follow spec
        return _.pick(test, 'testUrl', 'testUrls', 'driver', 'driverOptions', 'consoleResponse', 'logResponse', 'assert', 'compare') 
      })

      testsStarted+=nextTests.length
      console.log('pushing ' + nextTests.length + ' tests')
      q.push(nextTests)
    }
  }

  q.drain = function(){
    if(options.reproLog) {
      exports.loggers.reproLog.write('\n]\n')
    }
    callback()
  }

  q.empty() //call empty() to add tests, not push, because empty tracks the testsStarted
}


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



  var testsRemaining = options.totalRequests


  var enqueueTests = function(tests) {
    nextTests = _.first(tests, testsRemaining)
    nextTests = _.map(nextTests, function(test) { 
      // I'm not carrying around a bag of junk properties just cuz your generator doesn't follow spec
      return _.pick(test, 'testUrl', 'testUrls', 'driver', 'driverOptions', 'consoleResponse', 'logResponse', 'assert', 'compare') 
    })

    testsStarted += nextTests.length
    testsRemaining = options.totalRequests - testsStarted

    console.log('Queueing ' + nextTests.length + ' tests now. Total queued so far: ' + testsStarted + ' of ' + options.totalRequests + ' tests.')
    q.push(nextTests)
  }

  // use to delay execution when the generator is starving us
  var withNextTests = function(cb) {
    if(!generator.hasNextTests) {
      cb([])
    }

    var next = generator.getNextTests()
    if(next.length === 0) {
      setImmediate( function() { withNextTests(cb) } )
    } else {
      cb(next)
    }
  }


  q.empty = function(){
    if (testsRemaining > 0 && generator.hasNextTests()) {
      var tests = generator.getNextTests()

      if(tests.length === 0) {
        console.log("WARNING: concurrency dropping - test generator is starving the test runner")
        return withNextTests(enqueueTests)
      } 

      enqueueTests(tests)
    }
  }


  q.drain = function(){
    if(testsRemaining > 0 && generator.hasNextTests()) {
      console.log("WARNING: test queue has been drained early - starving with 0 outstanding requests - waiting VERY patiently")
      return withNextTests(enqueueTests)
    }

    if(options.reproLog) {
      exports.loggers.reproLog.write('\n]\n')
    }
    callback()
  }


  // This is a bit ugly, but basically delays calling enqueueTests 
  // until we've generated at least enough tests to feed the concurrency
  // otherwise we'll be starving the queue from the start
  if(generator.hasNextTests()) {
    var initialTests = []
    var buildInitialQueue = function(tests) {
      if(tests.length > 0) {
        initialTests = initialTests.concat(tests)
        console.log("Adding " + tests.length + " to initial tests. " + initialTests.length + " total ready.")
      }
      if(initialTests.length < options.concurrency && generator.hasNextTests()) {
        withNextTests( buildInitialQueue )
      } else {
        console.log("Ready to start testing.")
        enqueueTests(initialTests)
      }
    }
    buildInitialQueue([])
  }
}

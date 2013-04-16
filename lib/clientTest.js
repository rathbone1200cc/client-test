var fs    = require("fs"),
    _     = require("underscore"),
    _s    = require("underscore.string"),
    async = require("async")

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


exports.runTest = function(testOptions, callback) {
  var time = exports.makeTimeLog()
  var testOptions = _.extend({}, exports.runOptions, testOptions)
  var relativeUrl = (_.isFunction(testOptions.relativeUrl)) ? testOptions.relativeUrl() : testOptions.relativeUrl
  var driver = exports.getDriver(testOptions.driver)
      
  // console.log(testOptions)

  var endpointTasks = _.map( exports.runOptions.hostnames, function(hostname) { 
    return function(cb) {
      var absoluteUrl = hostname + relativeUrl
      driver.run(absoluteUrl, testOptions, time, function(body) {

        // Handle response assertions
        _.each(testOptions.assert, function(a) { a(body) })

        cb(null, body)
      })

    }
  })


  async.parallel( endpointTasks, function(err, results) {
      // Compare results from multiple endpoints
      if( results.length > 1 ) {
        // console.log(testOptions.compare)
        _.each(results, function(r) { console.log("r.length = " + JSON.parse(r).length) })
        _.each(testOptions.compare, function(c){ c(results) })      
      } 
      
      callback()
  })
}



var drivers = {}
exports.getDriver = function(name) {
  if(drivers[name]) {
    return drivers[name]
  }

  console.log("Loading driver: " + name)
  drivers[name] = require("./" + name + ".js")

  if(!drivers[name]) { throw "driver." + name + "is undefined" }

  return drivers[name]
}



var tests = []
exports.addTests = function(testDefinitions) {
    var testRunner = function(testOptions) {
      var test = function(callback){ exports.runTest(testOptions, callback) }
      return test
    }

    if(_.isArray(testDefinitions)) {
      tests = tests.concat(_.map(testDefinitions, testRunner))
    } else {
      tests.push(testRunner(testDefinitions))
    }


    console.log(tests.length + " total tests in the execution engine.")
}



exports.run = function(options, callback){
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


  var indexNextTest = 0;
  var concurrency = options.concurrency || 1
  var q = async.queue( function(test, callback) { test(callback) }, concurrency )

  q.empty = function(){
    console.log('already started: ' + exports.runOptions.testsStarted)
    console.log('test limit: ' + exports.runOptions.totalRequests)
    if (exports.runOptions.testsStarted < exports.runOptions.totalRequests) {
      exports.runOptions.testsStarted++;
      console.log('pushing test')
      q.push(tests[indexNextTest]);
      indexNextTest = (indexNextTest + 1) % tests.length;
    }
  }
  q.drain = function(){callback()}
  q.empty() //call empty() to add tests, not push, because empty tracks the testsStarted
}


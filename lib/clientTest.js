var fs    = require("fs"),
    _     = require("underscore"),
    _s    = require("underscore.string"),
    async = require("async"),
    assert= require('assert')

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


  var driver = exports.getDriver(runtimeDefinition.driver)

  var endpointTasks = _.map( testUrls, function(url) { 
    return function(cb) {
      driver.run(url, runtimeDefinition, time, exports.loggers, function(response) {

        // Handle response assertions
        _.each(runtimeDefinition.assert, function(a) { 
          // console.log("Asserting '" + a.check + "' - expecting: " + a.expect)
          exports.getAssertion(a.check)(response, a.expect) 
        })
        
        cb(null, response)
      })

    }
  })


  async.parallel( endpointTasks, function(err, results) {
      // Compare results from multiple endpoints
      if( results.length > 1 ) {
        _.each(runtimeDefinition.compare, function(c){ 
          exports.getComparator(c)(results) 
        })      
      } 
      
      callback()
  })
}


var _assertions = {}
var _comparators = {}
var _drivers = {}
var _parsers = {}


var getInternalStore = function(library) {
  switch(library) {
    case 'assertion' :  return _assertions
    case 'comparator' : return _comparators
    case 'driver' :     return _drivers
    case 'parser' :     return _parsers
    default :           throw("'" + library + "' is not a supported type of module.")
  }  
}

//TODO: consider a lazy-loading strategy
var registerModule = function(library, key, module) {
  if(!key) { throw("Must provide a key when registering a module") }
  var store = getInternalStore(library)
  if(store[key]) { throw("'" + library + "' key '" + key + "' is already defined. Keys must be unique.")}
  if(!_.isObject(module)) { throw("The " + key + " " + library + " module is not a valid object for registration.") }
  
  store[key] = module
}

var getModule = function(library, key) {
  var store = getInternalStore(library)
  if(!store[key]) { throw("" + library + " '" + key + "' is undefined. Are you sure you registered it?")}
  return store[key]
}


exports.registerAssertion = function(key, module) {
  registerModule("assertion", key, module)
}
exports.registerComparator = function(key, module) {
  registerModule("comparator", key, module)
}
exports.registerParser = function(key, module) {
  registerModule("parser", key, module)
}
exports.registerDriver = function(key, module) {
  registerModule("driver", key, module)
}


exports.getAssertion = function(key) {
  return getModule('assertion', key)
}
exports.getComparator = function(key) {
  return getModule('comparator', key)
}
exports.getParser = function(key) {
  return getModule('parser', key)
}
exports.getDriver = function(key) {
  return getModule('driver', key)
}


// Built-in modules
fs.readdirSync("./lib/parsers").forEach(function(file) {
  exports.registerParser(_s.strLeftBack(file, '.'), require("./parsers/" + file))
})
fs.readdirSync("./lib/drivers").forEach(function(file) {
  exports.registerDriver(_s.strLeftBack(file, '.'), require("./drivers/" + file))
})


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

  var parser = exports.getParser(options.parserContext.parserName)
  parser.init(options.parserContext)

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
      var nextTests = _.first(parser.nextTests(), testsRemaining)
      nextTests = _.map(nextTests, function(test) { 
        // I'm not carrying around a bag of junk properties just cuz your parser doesn't follow spec
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


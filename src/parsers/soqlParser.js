var fs    = require("fs"),
    _     = require("underscore"),
    _s    = require("underscore.string"),
    async = require("async"),
    customAssert = require("../assert.js"),
    url   = require("url")


exports.makeTests = function(file){
  var lines = fs.readFileSync(file).toString().split('\n')

  var tests = _.chain(lines)
    .filter(function(line){return line.trim().length > 0})
    .map(function(line){return parseLine(line)})
    .filter(function(testOptions){ return !testOptions.disabled})

    .value()

  console.log('read ' + tests.length + " eligible from input file")
  return tests;
}


var parseLine = function(line) {
  var options = {}
  var args = line.split(',')
  //options.testUrl = globalOptions.hostnames[0] + "/resource/" + args[0] + ".json"
  //options.inputPath = args[0] + ".json"

  var resource = url.parse(args[0])
  if(resource.host) {
    // It's a full URL, so we'll override the hostnames array
    console.log("Host: " + resource.host)
    options.hostnames = [resource.protocol + "//" + resource.host]
    options.inputPath = resource.path
  } else {
    // Not a path - treat as a SOQL resource
    options.inputPath = "/resource/" + args[0] + ".json"
  }


  var i = 0;
  function consume(){var arg = args[i]; i++; return _s.trim(arg);} while (i < args.length){
    var arg = consume()
    switch (arg) {
      case 'consoleResponse':
        options.consoleResponse = true
        break;
      case 'encodeQuery':
        var query = consume()
        options.inputPath += '?$query=' + encodeURIComponent(query)
        break;
      case 'addQueryParameter':
        var param = consume()
        var val = consume()
        options.inputPath += '&' + encodeURIComponent(param) + '=' + encodeURIComponent(val)
        break;
      case 'outputResponse': 
        options.outputResponse = true
        options.driver = "nodeRequest"
        break;
      case 'responsePerf':
        options.responsePerf = true
        options.driver = "nodeRequest"
        break;
      case 'assert':
        options.assert = options.assert || []
    	  options.assert.push( customAssert.getAssertion(consume(), eval(consume())) )
        options.driver = "nodeRequest"
        break;
      case 'compareEndpoints':
        options.compare = options.compare || []
        var assertion = consume()
        options.compare.push( customAssert.getComparator(assertion) )

        options.driver = "nodeRequest"
        break;
      case 'randomID':
        var cap = parseInt(consume())
        options.randomID = true
        options.randomIDCap = cap
        break;
      case 'randomLimit':
        var cap = parseInt(consume())
        options.randomLimit = true
        options.randomLimitMax = cap
        break;
      case 'randomOffset':
        var cap = parseInt(consume())
        options.randomOffset = true
        options.randomOffsetMax = cap
        break;
      case 'randomSelect':
        options.selectColumnCandidates = consume().split('|')
        options.randomSelect = true
        break;
      case 'randomColumn':
        options.selectRandomColumnCandidates = consume().split('|')
        options.selectRandomColumn = true
        break;
      case 'renderPage':
        options.renderPage = true
        options.driver = "phandomDriver"
        break;
      case 'domPerf':
        options.domPerf = true
        options.driver = "phandomDriver"
        break;
      case 'domContent':
        options.domContent = true
        options.driver = "phandomDriver"
        break;
      case 'disabled':
        options.disabled = true
    }
  }


  options.relativeUrl = function() { return generateRelativeUrl(options) }

  //console.log(options)
  return options
}


var generateRelativeUrl = function(options) {
  // var options = _.clone(options)

  var generatedPath = options.inputPath

  var replaceAll = function(str, o, n) { return str.split(o).join(n) }

  if (options.randomID) {
    var rand = Math.floor(Math.random() * options.randomIDCap) + 1
    generatedPath = replaceAll(generatedPath, 'RID', rand);
  }
  if (options.randomLimit) {
    var rand = Math.floor(Math.random() * options.randomLimitMax) + 1
    generatedPath = replaceAll(generatedPath, 'RLIMIT', rand);
  }
  if (options.randomOffset) {
    var rand = Math.floor(Math.random() * options.randomOffsetMax) + 1
    generatedPath = replaceAll(generatedPath, 'ROFFSET', rand);
  }
  if (options.randomSelect) {
    var selectColumns = []
    var remainingOptions = _.clone(options.selectColumnCandidates)
    var colsToSelect = Math.floor(Math.random() * options.selectColumnCandidates.length) + 1
    while (colsToSelect > 0) { 
      var randomColumnIndex = Math.floor(Math.random() * remainingOptions.length)
      selectColumns.push(remainingOptions[randomColumnIndex])
      remainingOptions[randomColumnIndex] = false
      remainingOptions = _.compact(remainingOptions)
      colsToSelect--
    } 
    generatedPath = replaceAll(generatedPath, "RSELECT", encodeURIComponent(selectColumns.join(', ')))
  }
  if (options.selectRandomColumn) {
    var options = _.clone(options.selectRandomColumnCandidates)
    var randomColumnIndex = Math.floor(Math.random() * options.length)
    var selectColumn = options[randomColumnIndex]
    generatedPath = replaceAll(generatedPath, "RCOLUMN", encodeURIComponent(selectColumn))
  }

  console.log("inputPath:\t" + options.inputPath)
  console.log("generatedPath:\t" + generatedPath)
  return generatedPath
}

var http  = require("http"),
    https = require("https"),
    url   = require("url"),
    fs    = require("fs"),
    _     = require("underscore"),
    _s    = require("underscore.string"),
    phantom = require("phantom"),
    customAssert = require("./assert.js")

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

exports.parse_options = function(line){
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

exports.run_test = function(testDef, callback){
  var options = exports.parse_options(testDef)
  var time = exports.makeTimeLog()
  if (options.nodeRequest){ exports.nodeRequest(options.testUrl, options, time, doLoadDom) }
  else doLoadDom()
  function doLoadDom(){
    if (options.loadDom) {
      exports.loadDom(options.testUrl, options, time, callback)
    } else callback()
  }
}

exports.nodeRequest = function(uri, options, time, callback){
  var urlOptions = url.parse(uri)
  var transport = urlOptions.protocol === "https:" ? https : http
  transport.get(urlOptions, function(response){
    time.log("first_byte")
    response.setEncoding('utf8')
    var chunks = []
    response.on('data', function(chunk){
      chunks.push(chunk)
    })
    response.on('end', function(){
      time.log("last_byte")
      var body = chunks.join('')
      if (options.outputResponse) {console.log(body)}
      if (options.assert) { 
        _.each(options.assert, function(assertion){
          var check = customAssert[assertion.check]
          check(body, assertion.expecting)
        })
      }
      console.log("first byte:\t" + time.clock("first_byte") 
        + "\ttransmission:\t" + (time.clock("last_byte") - time.clock("first_byte"))
        + "\tresponse complete:\t" + time.clock("last_byte")
        + "\tcontent-length:\t" + response.headers['content-length']
        + "\tuncompressed chars:\t" + body.length)
      callback()
    })
    response.on('close', function(){
      console.log("connection closed unexpectedly")
      callback()
    })
  })
}

exports.loadDom = function(uri, options, time, callback){
  phantomLazy(function(ph){
    ph.createPage(function(pageObj){
      pageObj.set("libraryPath", "lib.client")
      pageObj.set("viewportSize",{ width: 1200, height: 800 })
      pageObj.set("onConsoleMessage", function(msg){console.log(msg)})
      pageObj.set("onError", function(msg, trace){console.log(msg + trace)})
      pageObj.set("onLoadStarted", function(status){console.log('started loading in phantom')})
      //pageObj.set("onError", function(msg, trace){
      //  console.log("received error")
      //  errors.write("errors?")
      //  errors.write(msg)
      //  errors.write(trace)
      //  errors.flush()
      //})
      pageObj.open(uri, function(status){
        console.log("page in phantom is " + status)
        if (options.domContent){
          pageObj.get("content", function(content){console.log(content)})
        }
        if (options.renderPage){
          var renderFile = "output/" + encodeURIComponent(uri) + new Date().getTime() + ".png"
          pageObj.render(renderFile, function(){console.log("rendered " + renderFile ); callback()})
        } else { callback() }
      })
    })
  })
}

exports.makeTests = function(file){
  var lines = fs.readFileSync(file).toString().split('\n').reverse()
  var lines_filtered = _.filter(lines,function(line){return line.length > 0})
  var tests = _.map(lines_filtered, function(line){
    var test = function(callback){exports.run_test(line, callback)}
    test.description = line
    return test
  })
  return tests;
}

exports.run = function(file, callback){
  var tests = exports.makeTests(file)
  var loop_in_series = function(){
    if (tests.length > 0){
      var test = tests.pop()
      test(loop_in_series)
    } else { callback() }
  }
  loop_in_series()
}

function phantomLazy(callback){
  if (!exports.phantomObj) {
    phantom.create(function(ph){
      exports.phantomObj = ph
      callback(exports.phantomObj)
    })
  } else { callback(exports.phantomObj)}
}

var errors = fs.createWriteStream(
  "output/client-errors.out",
  { flags: 'a'}
)


///TODO: remove below, once fully integrated with above
/*
function try_phantom() {
  phantom.create(function(ph){
    ph.createPage(function(page){
      page.set("viewportSize",{ width: 1200, height: 800 })
      page.set("onConsoleMessage", function(msg){console.log(msg)})
      page.set("onLoadStarted", function(status){console.log('started loading')})
      page.set("onError", function(msg, trace){
        console.log("received error")
        errors.write(msg)
        errors.write(trace)
      })
      page.open("https://opendata.test-socrata.com/", function(status){
        console.log("page request status is " + status)
        page.evaluate(
          function(){console.log("returning title"); return document.title}, 
          function(result){console.log(result)}
        )
        page.render("output/screenshot.png", function(){console.log("rendered")})
        page.evaluate(
          function(){return $(".browseList")[0].getBoundingClientRect()},
          function(result){
            console.log("rectangle is " + result)
            page.set("clipRect", result, function(){
              page.render("output/rect.png", function(){console.log("rendered rectangle")})
            })
          }
        )
        page.evaluate( function(){ throw new Error("mock error")})
      })
    })
  })
}
*/

var http  = require("http"),
    https = require("https"),
    url   = require("url"),
    fs    = require("fs"),
    _     = require("underscore"),
    phantom = require("phantom")

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

exports.parse_options = function(args){
  var options = {}
  _.each(args, function(arg){
    if (arg === 'outputResponse') {options.outputResponse = true}
    if (arg === 'responsePerf')   {options.responsePerf = true}
    if (arg === 'renderPage')     {options.renderPage = true}
    if (arg === 'domPerf')        {options.domPerf = true}
    if (arg === 'domContent')     {options.domContent = true}
  })
  if ( options.outputResponse
       || options.responsePerf ) {
    options.nodeRequest = true
  }
  if ( options.renderPage
       || options.domPerf) {
    options.loadDom = true
  }
  console.log(options)
  return options
}

exports.run_test = function(testDef, callback){
  var options = exports.parse_options(testDef)
  var testUrl = testDef[0]
  var time = exports.makeTimeLog()
  if (options.nodeRequest){ exports.nodeRequest(testUrl, options, time, doLoadDom) }
  else doLoadDom()
  function doLoadDom(){
    if (options.loadDom) {
      exports.loadDom(testUrl, options, time, callback)
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
  phantomObj.createPage(function(page){
    pageObj = page
    pageObj.set("libraryPath", "lib.client")
    page.set("viewportSize",{ width: 1200, height: 800 })
    page.set("onConsoleMessage", function(msg){console.log(msg)})
    page.set("onError", function(msg, trace){console.log(msg + trace)})
    page.set("onLoadStarted", function(status){console.log('started loading in phantom')})
    //page.set("onError", function(msg, trace){
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
}

var phantomObj
exports.run = function(file, callback){
  var lines = fs.readFileSync(file).toString().split('\n').reverse()
  var lines_filtered = _.filter(lines,function(line){return line.length > 0})
  var rows = _.map(lines_filtered, function(line){return line.split('\t')})
  var loop_in_series = function(){
    if (rows.length > 0){
      exports.run_test(rows.pop(), loop_in_series) 
    } else { callback() }
  }
  phantom.create(function(ph){
    phantomObj = ph
    loop_in_series()
  })
}

var errors = fs.createWriteStream(
  "output/client-errors.out",
  { flags: 'a'}
)


///TODO: remove below, once fully integrated with above
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

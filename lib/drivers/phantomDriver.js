
var phantom = require("phantom"),
    fs = require("fs")


exports.run = function(testUrl, options, time, loggers, callback){
  var driverOptions = options.driverOptions || {}

  phantomLazy(function(ph){
    // console.log("phandomDriver: " + testUrl)
    ph.createPage(function(pageObj){
      pageObj.set("libraryPath", "lib.client")
      pageObj.set("viewportSize",{ width: 1200, height: 800 })
      pageObj.set("onConsoleMessage", function(msg){console.log(msg)})
      pageObj.set("onError", function(msg, trace){console.log(msg + trace)})
      pageObj.set("onLoadStarted", function(status){
        time.log("dom_load_start")
        console.log('started loading in phantom')
      })
      //pageObj.set("onError", function(msg, trace){
      //  console.log("received error")
      //  errors.write("errors?")
      //  errors.write(msg)
      //  errors.write(trace)
      //  errors.flush()
      //})
      time.log("phantom_request")
      pageObj.open(testUrl, function(status){
        time.log("dom_loaded")
        if (loggers.domPerfFile) {
          loggers.domPerfFile.write("phantom request start:\t" + time.clock("phantom_request") 
            + "\tstarting dom:\t" + (time.clock("dom_load_start") - time.clock("phantom_request"))
            + "\tdom loaded:\t" + (time.clock("dom_loaded") - time.clock("phantom_request"))
            + "\tdom load time:\t" + (time.clock("dom_loaded") - time.clock("dom_load_start"))
            + '\n')
        }
        console.log("page in phantom is " + status)
        if (options.logResponse){
          var outputFile = "output/dom_content/" 
            + encodeURIComponent(testUrl) + new Date().getTime() + ".txt"
          pageObj.get("content", function(content){
            fs.writeFile(outputFile, content)
          })
        }

        var cbResponse = { statusCode : status, page : pageObj }
        if (driverOptions.renderPage){
          var renderFile = "output/rendered/" 
            + encodeURIComponent(testUrl) + new Date().getTime() + ".png"
          pageObj.render(renderFile, function(){console.log("rendered " + renderFile ); callback(cbResponse)})
        } else { callback(cbResponse)
        }
      })
    })
  })
}

function phantomLazy(callback){
  if (!exports.phantomObj) {
    console.log("Creating Phantom Object")
    phantom.create(function(ph){
      console.log("Creating Phantom Object")
      exports.phantomObj = ph
      callback(exports.phantomObj)
    })
  } else { callback(exports.phantomObj)}
}

/*

var errors = fs.createWriteStream(
  "output/client-errors.out",
  { flags: 'a'}
)
*/


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

var phantom = require("phantom"),
    fs      = require("fs")

var errors = fs.createWriteStream(
  "output/client-errors.out",
  { flags: 'a'}
)

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

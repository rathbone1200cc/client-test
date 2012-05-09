var phantom = require("phantom")

phantom.create(function(ph){
  ph.createPage(function(page){
    page.set("viewportSize",{ width: 1200, height: 800 })
    page.set("onConsoleMessage", function(msg){console.log(msg)})
    page.set("onLoadStarted", function(status){console.log('started loading')})
    page.open("https://opendata.test-socrata.com/", function(status){
      console.log("page request status is " + status)
      page.evaluate(
        function(){console.log("returning title"); return document.title}, 
        function(result){console.log(result)}
      )
      page.render("screenshot.png", function(){console.log("rendered")})
    })
  })
})

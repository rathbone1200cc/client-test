var phantom = require("phantom")

phantom.create(function(ph){
  ph.createPage(function(page){
    console.log(page)
    page.set("viewportSize",{ width: 1200, height: 800 })
    page.open("http://danrathbone.com/blog/", function(status){
      console.log(status)
      page.evaluate(function(){return document.title}, function(result){
        console.log(result)
        page.render("dr.png", function(){console.log("rendered")})
      })
    })
  })
})

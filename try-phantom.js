var phantom = require("phantom")

phantom.create(function(ph){
  ph.createPage(function(page){
    page.open("http://danrathbone.com", function(status){
      console.log(status)
      page.evaluate(function(){return document.title}, function(result){
        console.log(result)
      })
      page.render("dr.png", function(){console.log("rendered")})
    })
  })
})

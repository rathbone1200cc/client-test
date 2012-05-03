var request = require("request")

exports.time_request = function(uri, callback){
  var stime = new Date().getTime()
  console.log("requesting " + uri)
  request({uri:uri}, function(error, response, body){
    var ftime = new Date().getTime()
    console.log(uri + " took " + (ftime - stime))
    callback()
  })
}

exports.run = function(callback){
  exports.time_request("https://opendata.test-socrata.com/resource/zanv-9p4p.json?$select=location", function(){
    callback()
  })
}

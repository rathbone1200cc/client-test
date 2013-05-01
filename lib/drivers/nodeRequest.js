
var http  = require("http"),
    https = require("https"),
    url   = require("url"),
    _     = require("underscore"),
    fs    = require("fs")

var firstRun = true;

exports.run = function(testUrl, options, time, loggers, callback){
  console.log("nodeRequest: " + testUrl)
  var urlOptions = url.parse(testUrl)
  urlOptions.rejectUnauthorized = false // useful for dev environment
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
      if (options.logResponse) {
        var outputFile = "output/response_content/" 
          + encodeURIComponent(testUrl) + new Date().getTime() + ".txt"
        fs.writeFile(outputFile, body)
      }
      if (options.consoleResponse){
        console.log(body)
      }

      if (loggers.responsePerfFile){
        var keys = time.keys()
        if (firstRun) {
          var columnTitles = time.keys()
          columnTitles.push('content-length')
          columnTitles.push('response_code')
          columnTitles.push('options')
          loggers.responsePerfFile.write(columnTitles.join('\t'))
          loggers.responsePerfFile.write('\n')
          firstRun = false
        }
        for (key in keys) {
          loggers.responsePerfFile.write(time.clock(keys[key]) + '\t')
        }
        loggers.responsePerfFile.write(body.length + '\t')
        loggers.responsePerfFile.write(response.statusCode + '\t')
        loggers.responsePerfFile.write(testUrl)
        loggers.responsePerfFile.write('\n')
      }
      callback({
        statusCode: response.statusCode,
        headers : response.headers,
        body : body
      })
    })
    
    response.on('close', function(){
      console.log("connection closed unexpectedly")
      callback()
    })
  })
}

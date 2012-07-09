
var http  = require("http"),
    https = require("https"),
    url   = require("url"),
    _     = require("underscore"),
    customAssert = require("./assert.js"),
    fs    = require("fs")


exports.run = function(testOptions,  runOptions, time, callback){
  console.log("running in nodeRequest for " + testOptions.testUrl)
  debugger;
  if (testOptions.nodeRequest) {
    var urlOptions = url.parse(testOptions.testUrl)
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
        if (testOptions.outputResponse) {
          var outputFile = "output/response_content/" 
            + encodeURIComponent(testOptions.testUrl) + new Date().getTime() + ".txt"
          fs.writeFile(outputFile, body)
        }
        if (testOptions.consoleResponse){
          console.log(body)
        }
        if (testOptions.assert) { 
          _.each(testOptions.assert, function(assertion){
            var check = customAssert[assertion.check]
            check(body, assertion.expecting)
          })
        }
        if (testOptions.responsePerf){
          var keys = time.keys()
          if (!runOptions.responsePerfColumnTitlesWritten) {
            var columnTitles = time.keys()
            columnTitles.push('content-length')
            columnTitles.push('response_code')
            columnTitles.push('options')
            runOptions.responsePerfFile.write(columnTitles.join('\t'))
            runOptions.responsePerfFile.write('\n')
            runOptions.responsePerfColumnTitlesWritten = true
          }
          for (key in keys) {
            runOptions.responsePerfFile.write(time.clock(keys[key]) + '\t')
          }
          runOptions.responsePerfFile.write(body.length + '\t')
          runOptions.responsePerfFile.write(response.statusCode + '\t')
          runOptions.responsePerfFile.write(JSON.stringify(testOptions))
          runOptions.responsePerfFile.write('\n')
        }
        callback()
      })
      response.on('close', function(){
        console.log("connection closed unexpectedly")
        callback()
      })
    })
  } else { callback() }
}

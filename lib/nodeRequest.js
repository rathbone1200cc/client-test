
var http  = require("http"),
    https = require("https"),
    url   = require("url"),
    _     = require("underscore"),
    customAssert = require("./assert.js"),
    fs    = require("fs")


exports.run = function(uri, options, time, callback){
  console.log("running in nodeRequest for " + uri)
  debugger;
  if (options.nodeRequest) {
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
        if (options.outputResponse) {
          var outputFile = "output/response_content/" 
            + encodeURIComponent(uri) + new Date().getTime() + ".txt"
          fs.writeFile(outputFile, body)
        }
        if (options.consoleResponse){
          console.log(body)
        }
        if (options.assert) { 
          _.each(options.assert, function(assertion){
            var check = customAssert[assertion.check]
            check(body, assertion.expecting)
          })
        }
        if (options.responsePerf){
          var responsePerfFile = fs.createWriteStream(
            "output/perf/responsePerf.tsv",
            { flags: 'a'}
          )
          responsePerfFile.write("first byte:\t" + time.clock("first_byte") 
            + "\ttransmission:\t" + (time.clock("last_byte") - time.clock("first_byte"))
            + "\tresponse complete:\t" + time.clock("last_byte")
            + "\tcontent-length:\t" + response.headers['content-length']
            + "\tuncompressed chars:\t" + body.length 
            + '\n')
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

var http  = require("http"),
    https = require("https"),
    url   = require("url"),
    _     = require("lodash"),
    fs    = require("fs"),
    util  = require('util')
;

exports.options = function(){
  return [{
    option: "--https",
    description: "use https instead of http"
  },
  {
    option: "-m --method <method>",
    description: "http method, defaults to GET"
  },
  {
    option: "-h --header <header:value[,header:value]>",
    description: "add headers"
  },
  {
    option: "-d --data <string>",
    description: "send data with request"
  },
  {
    option: "-f --file <path>",
    description: "send file's data with request"
  },
  {
    option: "-v --verbose",
    description: "logs the response text"
  }];
}

exports.examples = function(){
  return [
    "-p -v                  # log response and performance metrics",
    '-m POST -f body.json -h Content-Type:"application/json  # post file data with custom header"',
  ]
}

var firstRun = true;
exports.run = function(options, stopwatch, callback){
  var urlOptions = url.parse(options.url)
  urlOptions.rejectUnauthorized = false; // useful for dev environment
  var transport; 
  transport = urlOptions.protocol === "https:" ? https : http;
  transport = options.https ? https : transport;
  urlOptions.method = options.method || "GET";
  for (h in options.headers){ urlOptions.headers[h] = options.headers[h]; }

  stopwatch("request_start");
  var req = transport.request(urlOptions, function(response){
    stopwatch("first_byte");
    response.setEncoding('utf8');
    var chunks = []

    response.on('data', function(chunk){ chunks.push(chunk); })
    response.on('end', function(){
      stopwatch("last_byte");
      var body = chunks.join('')

      debugger;
      callback({
        statusCode: response.statusCode,
        headers : response.headers,
        body : body
      })
    })
    
    response.on('close', function(){
      debugger;
      console.log("connection closed unexpectedly")
      callback({
        statusCode: -1,
        body: "connection closed unexpectedly"
      })
    })

    response.on("error", function(err){
      console.log(err);
    });
  })

  if(options.data) {
    if(_.isString(options.data)) { 
      req.write(options.data)
    } else {
      req.write(JSON.stringify(options.data))      
    }
  }

  req.on('error', function(err){
    console.log("client-side request timeout: " + err);
    debugger;
    callback({
      statusCode: -1,
      body: "client side timeout"
    });
  });

  if (options.timeout){
    req.setTimeout(options.timeout, req.abort);
  }

  req.end();

}

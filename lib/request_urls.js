var http  = require("http"),
    https = require("https"),
    url   = require("url"),
    fs    = require("fs"),
    _     = require("underscore")

exports.makeTimeLog = function(){
  var times = {}
  function log_time(key){ times[key] = new Date().getTime() }
  log_time("start")
  return {
    log:log_time,
    clock:          function(k)  {return times[k] - times["start"]},
    diff:         function(f,s){return times[s] - times[f]}
  }
}
exports.process_request = function(uri, callback){
  var time = exports.makeTimeLog()
  console.log("requesting " + uri)
  var options = url.parse(uri)
  var load_dom = true
  var transport = options.protocol === "https:" ? https : http
  transport.get(options, function(response){
    time.log("first_byte")
    response.setEncoding('utf8')
    //response.on('data', function(chunk){
    //  //console.log(chunk)
    //})
    response.on('end', function(){
      time.log("last_byte")
      console.log("first byte:\t" + time.clock("first_byte") 
        + "\ttransmission:\t" + (time.clock("last_byte") - time.clock("first_byte"))
        + "\tresponse complete:\t" + time.clock("last_byte"))
      callback()
    })
    response.on('close', function(){
      console.log("connection closed")
      callback()
    })
  })
}

exports.run = function(callback){
  var urls = _.filter(fs.readFileSync(process.argv[2]).toString().split('\n').reverse(),
    function(line){return line.length > 0})
  var loop_in_series = function(){
    if (urls.length > 0){
      exports.process_request(urls.pop(), loop_in_series) 
    } else { callback() }
  }
  loop_in_series()
}

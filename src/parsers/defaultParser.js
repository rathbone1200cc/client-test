var fs    = require("fs"),
    _     = require("underscore")


exports.makeTests = function(file){
  var lines = fs.readFileSync(file).toString().split('\n')

  var tests = _.map( lines, function(line) {

    var resource = url.parse(line)

    // If it's a full URL, pull out thre relativeUrl and override the hostnames array
    if(resource.host) {
      return {
        relativeUrl : resource.path,
        hostnames : [resource.protocol + "//" + resource.host]
      }
    } 

    return { relativeUrl = line }
  })

  console.log('read ' + tests.length + " eligible from input file")
  return tests;
}

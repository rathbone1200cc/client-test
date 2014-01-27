var fs    = require("fs"),
    _     = require("lodash")

/*
  urls test generator:
    Each line is a test
    Each test is one or or more absolute URLs (semi-colon delimited)
      OR
    Each test may be a single path (with one or more hostnames specified by context.hostnames)

  Examples of valid lines using absolute URLs (context.hostnames should not be specified):
    http://mydomain.com/some_path
    http://mydomain.com/some_path; http://mydomain.com/some_path?enable=experiment123
    
  Example of valid lines using path ASSUMING context.hostnames is specified
    /some_path
    /some/other/path.html?with=params&to=go

  Not valid because I'm not currently interested in dealing with cross-product of paths and hostnames:
    /some_path; /some_other_path
*/


exports.parse = function(path, callback){
  var tests;
  try {
    var lines = fs.readFileSync(path).toString().split('\n')
    if (lines[lines.length - 1] === '') lines.pop();
    tests = _.map( lines, function(line) {
      return {url:line};
    })
    console.log('read ' + tests.length + " tests from input file")
  }
  catch(err){
    return callback(err);
  }
  callback(null, tests);
}

var fs    = require("fs");

exports.parse = function(path, callback){
  var tests;
  try {
    debugger;
    tests = JSON.parse(fs.readFileSync(path));
    console.log('read ' + tests.length + " tests from input file");
  }
  catch(err){
    return callback(err);
  }
  callback(null, tests);
}

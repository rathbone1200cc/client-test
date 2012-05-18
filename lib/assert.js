var assert = require('assert'),
    _ = require('underscore')

exports.resultShape = function(response, expected){
  console.log("running assert resultShape")
  var results = JSON.parse(response)
  assert.ok(results.length > 0, "no results to compare")
  _.each(results, function(result){
    assert.ok( _.isEqual(_.keys(result), expected), 
      "result doesn't have expected keys" 
      + JSON.stringify(result) + ' ' + JSON.stringify(expected))
  })
}

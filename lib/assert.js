var assert = require('assert'),
    _ = require('underscore')


// Assertions based on a single response
exports.statusCode = function(response, expected) {
  assert(_.isNumber(response.statusCode), "Response does not have a valid statusCode:\n" + JSON.stringify(response))
  assert.strictEqual(response.statusCode, expected, "Expected: " + expected + "\nReceived: " + response.body)
}


exports.responseBody = function(response, expected) {
  assert(_.isString(response.statusCode), "Response does not have a body:\n" + JSON.stringify(response))
  assert.strictEqual(response.statusCode, parseInt(expected), "Expected: " + expected + "\nReceived: " + response.body)
}


exports.jsonResultCount = function(response, expected) {
  assert(_.isString(response.body), "Response does not have a body:\n" + JSON.stringify(response))

  var expectedCount = parseInt(expected)
  console.log("checking for " + expectedCount + " rows")
  var results = JSON.parse(response.body)
  assert.ok(results.length === expectedCount, "received " + results.length + " rows, expected " + expectedCount)
}


exports.jsonResult = function(response, expected) {
  assert(_.isString(response.body), "Response does not have a body:\n" + JSON.stringify(response))

  console.log("deep comparison of parsed JSON")
  var expectedObj = JSON.parse(expected)
  var responseObj = JSON.parse(response.body)
  assert.deepEqual(responseObj, expectedObj, "\nExpected: " + expected + "\nReceived: " + response.body)
}


exports.jsonKeys = function(response, expected) {
  assert(_.isString(response.body), "Response does not have a body:\n" + JSON.stringify(response))

  var results = JSON.parse(response.body)
  assert.ok(results.length > 0, "no results to compare")
  _.each(results, function(result){
    assert.ok( _.isEqual(_.keys(result), expected), 
      "result doesn't have expected keys" 
      + JSON.stringify(result) + ' ' + JSON.stringify(expected))
  })
}






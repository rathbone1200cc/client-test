var assert = require('assert'),
    _ = require('underscore')


// Assertions based on a single response
exports.statusCode = function(response, expected) {
  assert(_.isNumber(response.statusCode), "Response does not have a valid statusCode:\n" + JSON.stringify(response))
  assert.strictEqual(response.statusCode, parseInt(expected), "Expected: " + expected + "\nReceived: " + response.statusCode)
}


exports.responseBody = function(response, expected) {
  assert(_.isString(response.body), "Response does not have a body:\n" + JSON.stringify(response))
  assert.strictEqual(response.body, expected, "Expected: " + expected + "\nReceived: " + response.body)
}


exports.jsonResultCount = function(response, expected) {
  assert(_.isString(response.body), "Response does not have a body:\n" + JSON.stringify(response))

  var expectedCount = parseInt(expected)
  console.log("checking for " + expectedCount + " rows")
  var results = JSON.parse(response.body)
  assert.strictEqual(results.length, expectedCount, "received " + results.length + " rows, expected " + expectedCount)
}


exports.jsonResult = function(response, expected) {
  assert(_.isString(response.body), "Response does not have a body:\n" + JSON.stringify(response))

  // console.log("deep comparison of parsed JSON")
  var expectedObj = JSON.parse(expected)
  var responseObj = JSON.parse(response.body)
  assert.deepEqual(responseObj, expectedObj, "\nExpected: " + expected + "\nReceived: " + response.body)
}


exports.jsonUnorderedArray = function(response, expected) {
  assert(_.isString(response.body), "Response does not have a body:\n" + JSON.stringify(response))

  // console.log("deep comparison of parsed JSON ignoring order (slow)")
  var expectedArr = JSON.parse(expected)
  var responseArr = JSON.parse(response.body)


  var alreadyFound = []
  _.each(responseArr, function(obj) {
    for(var j=0; j<expectedArr.length; j++) {
      if(_.isEqual(obj, expectedArr[j]) && !alreadyFound[j]) {
        alreadyFound[j] = true
        return
      }
    }
    assert.fail(responseArr, expectedArr, 
      "Failed to find object in JSON array. Missing [at least one instance of]:\n" + JSON.stringify(obj))
  })
}

exports.jsonKeys = function(response, expected) {
  assert(_.isString(response.body), "Response does not have a body:\n" + JSON.stringify(response))

  console.log("Checking for keys: " + expected)
  var results = JSON.parse(response.body)
  assert.ok(results.length > 0, "no results to compare")
  _.each(results, function(result){
    expectedObj = (_.isObject(expected)) ? expected : JSON.parse(expected)
    _.each(expectedObj, function(key) {
      assert.ok( result.hasOwnProperty(key), "Missing key " + key + " in result: \n" + JSON.stringify(result))
    })
    // assert.ok( _.isEqual(_.keys(result), JSON.parse(expected)), 
    //   "result doesn't have expected keys.\nExpected keys: " 
    //   + JSON.stringify(expected) + "\nin result: " + JSON.stringify(result))
  })
}






var assert = require('assert'),
    _ = require('underscore')



exports.getAssertion = function(assertion, expectation) {
  return function(response) { 
    assertions[assertion](response, expectation)
  }
}

exports.getComparator = function(comparator) {
  return function(responses) { 
    comparators[comparator](responses)
  }
}

// Assertions based on a single response
var assertions = {
  resultShape : function(response, expected){
    console.log("running assert resultShape")
    var results = JSON.parse(response)
    assert.ok(results.length > 0, "no results to compare")
    _.each(results, function(result){
      assert.ok( _.isEqual(_.keys(result), expected), 
        "result doesn't have expected keys" 
        + JSON.stringify(result) + ' ' + JSON.stringify(expected))
    })
  },

  rowCount : function(response, exp) {
    var expected = parseInt(exp)
    console.log("checking for " + expected + " rows")
    var results = JSON.parse(response)
    assert.ok(results.length === expected, "received " + results.length + " rows, expected " + expected)
  }
}



//
// Assertions based on the responses of multipe hostnames with the same relative URL
//
var comparators = {
  resultsMatch : function(responses) {
    var expected = JSON.parse(responses[0]);
    _.chain(responses)
      .rest()
      .each( function(result) {

        // TODO: implement an assertion that can play nice when order is NOT guaranteed
        var received = JSON.parse(result)
        assert.deepEqual(received, expected, "Expected:\n" + expected + "\nReceived:\n" + received)
      })
  },

  rowCountsMatch : function(responses) {
    var expected = JSON.parse(responses[0]);
    var expectedCount = expected.length;
    console.log("Checking for " + expectedCount + " rows (as found by first hostname).")

    _.chain(responses)
      .rest()
      .each( function(result) {
        var receivedCount = JSON.parse(result).length
        assert.ok(receivedCount === expectedCount, "Expected " + expectedCount + " rows. Received " + receivedCount)
      })
  }

}



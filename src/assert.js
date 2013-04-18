var assert = require('assert'),
    _ = require('underscore')



exports.getAssertion = function(assertion) {
  return assertions[assertion]
}

exports.getComparator = function(comparator) {
  return comparators[comparator]
}


// Assertions based on a single response
var assertions = {
  resultShape : function(response, expected){
    console.log("running assert resultShape")
    assert(response.body, "Response does not have a body:\n" + JSON.stringify(response))

    var results = JSON.parse(response.body)
    assert.ok(results.length > 0, "no results to compare")
    _.each(results, function(result){
      assert.ok( _.isEqual(_.keys(result), expected), 
        "result doesn't have expected keys" 
        + JSON.stringify(result) + ' ' + JSON.stringify(expected))
    })
  },

  rowCount : function(response, exp) {
    assert(response.body, "Response does not have a body:\n" + JSON.stringify(response))

    var expected = parseInt(exp)
    console.log("checking for " + expected + " rows")
    var results = JSON.parse(response.body)
    assert.ok(results.length === expected, "received " + results.length + " rows, expected " + expected)
  }
}



//
// Assertions based on the responses of multipe hostnames with the same relative URL
//
var comparators = {
  resultsMatch : function(responses) {
    _.each(responses, function(res) { assert(res.body, "response does not have a body:\n" + JSON.stringify(responses)) } )
    
    var expected = JSON.parse(responses[0].body);
    _.chain(responses)
      .rest()
      .each( function(result) {

        // TODO: implement an assertion that can play nice when order is NOT guaranteed
        var received = JSON.parse(result.body)
        assert.deepEqual(received, expected, "Expected:\n" + expected + "\nReceived:\n" + received)
      })
  },

  rowCountsMatch : function(responses) {
    _.each(responses, function(res) { assert(res.body, "response does not have a body:\n" + JSON.stringify(responses)) } )

    var expected = JSON.parse(responses[0].body);
    var expectedCount = expected.length;
    console.log("Checking for " + expectedCount + " rows (as found by first hostname).")

    _.chain(responses)
      .rest()
      .each( function(result) {
        var receivedCount = JSON.parse(result.body).length
        assert.ok(receivedCount === expectedCount, "Expected " + expectedCount + " rows. Received " + receivedCount)
      })
  }

}



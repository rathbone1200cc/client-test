var assert = require('assert'),
    _ = require('underscore'),
    check = require('./assert.js')

//
// Assertions based on the responses of multipe hostnames with the same relative URL
//

exports.statusCodes = function(responses) {
  _.each(responses, function(res) { assert(_.isString(res.statusCode), "response does not have a statusCode:\n" + JSON.stringify(res)) } )
  console.log("comparing statusCodes of " + responses.length + " responses")

  var expected = responses[0].statusCode
  _.each(_.rest(responses), function(res) {
    check.statusCode(res, expected)
  })
}


exports.responseBodies = function(responses) {
  _.each(responses, function(res) { assert(_.isString(res.body), "response does not have a body:\n" + JSON.stringify(res)) } )
  console.log("comparing responseBodies of " + responses.length + " responses")

  var expected = responses[0].body
  _.each(_.rest(responses), function(res) {
    check.responseBody(res, expected)
  })
}


exports.jsonResultCounts = function(responses) {
  _.each(responses, function(res) { assert(_.isString(res.body), "response does not have a body:\n" + JSON.stringify(res)) } )
  console.log("comparing jsonResultCounts of " + responses.length + " responses")
  
  var expected = JSON.parse(responses[0].body).length;
  _.each(_.rest(responses), function(res) {
    check.jsonResultCount(res, expected)
  })
}


exports.jsonResults = function(responses) {
  _.each(responses, function(res) { assert(_.isString(res.body), "response does not have a body:\n" + JSON.stringify(res)) } )
  console.log("comparing jsonResults of " + responses.length + " responses")

  var expected = responses[0].body;
  _.each(_.rest(responses), function(res) {
    check.jsonResult(res, expected)
  })
}

exports.jsonUnorderedArrays = function(responses) {
  _.each(responses, function(res) { assert(_.isString(res.body), "response does not have a body:\n" + JSON.stringify(res)) } )
  console.log("comparing jsonUnorderedArrays of " + responses.length + " responses")

  var expected = responses[0].body;
  _.each(_.rest(responses), function(res) {
    check.jsonUnorderedArray(res, expected)
  })
}






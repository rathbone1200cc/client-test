var assert = require('assert'),
    clientTest = require('../lib/clientTest.js'),
    _ = require('underscore')

describe('client test', function(){
  var file = './input/staging_html.tsv'
  describe(file, function(){
    var tests = clientTest.makeTests(file)
    _.each(tests, function(test){it(test.description, function(done){test(done)})})
  })
})

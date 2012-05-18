var assert = require('assert'),
    clientTest = require('../lib/clientTest.js'),
    _ = require('underscore')

describe('injecting client tests', function(){
  var files = ['./input/staging_html.tsv',
               './input/staging_json.tsv']
  _.each(files, function(file){ describe(file, function(){
    var tests = clientTest.makeTests(file)
    _.each(tests, function(test){it(test.description, function(done){test(done)})})
  })})
})

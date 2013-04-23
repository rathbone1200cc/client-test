var fs    = require("fs"),
    _     = require("underscore"),


exports.makeTests = function(file){
  throw("HydraTestGenerator is not yet implemented.")
  return [];
}

/// Self-register generator
exports.register = function() {
    var clientTest = require('../../lib/clientTest.js')
    clientTest.registerGenerator('hydraTestGenerator', exports)
}

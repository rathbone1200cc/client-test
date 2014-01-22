var
assert = require('assert')
;

var log = console.log;

module.exports = function(client){
  assert.equal(typeof(client.run), 'function', "client must define run method");
  var options = client.options();
  var examples = client.examples();
  assert.equal(typeof(options), 'object', "client must define options method which returns array");

  var d = {
    client: client,
    options: options,
    examples: examples,
    drive: function(test, callback){
      log("driver starting test");
      d.client.run(test, function(err){
        log("driver done with test");
        callback();
      });
    }
  }
  return d;
}

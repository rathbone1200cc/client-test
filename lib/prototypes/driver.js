var
assert = require('assert')
;

var log = console.log;

module.exports = function(client){
  assert.equal(typeof(client.run), 'function', "client must define run method");
  var d = {
    client: client,
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

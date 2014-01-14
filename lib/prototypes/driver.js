var
assert = require('assert')
;

var log = console.log;

var driver = {
  drive: function(test, callback){
    log("driver starting test");
    this.client.run(test, function(err){
      log("driver done with test");
      callback();
    });
  }
}

module.exports = function(client){
  assert.equal(client.drive, undefined, "client must not override drive method");
  assert.equal(typeof(client.run), 'function', "client must define run method");
  var d = Object.create(driver);
  d.client = client;
  return d;
}

var
assert = require('assert'),
events = require('events')
;

var log = console.log;
var generator = new events.EventEmitter();

module.exports = function(parser){
  var g = Object.create(generator);
  g.parser = parser;
  g.t = 0;
  g.tests = [{path:'/'}];
  g.input = function(input){
    var that = this;
    this.parser.parse(input, function(err, tests){
      if (err){
        log(err);
      }
      else {
        that.tests = tests;
        that.emit("tests");
      }
    });
  }
  g.nextTest = function(){
    var test = this.tests[this.t];
    this.t++;
    this.t = this.t % this.tests.length;
    return test;
  }
  return g;
}

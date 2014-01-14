var
assert = require('assert')
;

var log = console.log;

var generator = {
  input: function(input, callback){
    var that = this;
    this.parser.parse(input, function(err, tests){
      that.tests = tests;
    });
  },
  t:0,
  nextTest: function(){
    var test = this.tests[this.t];
    this.t = this.t++ % this.tests.length;
    return test;
  },
  tests:[{path:'/'}]
}

module.exports = function(parser){
  //assert.equal(typeof(parser.parse), 'function', "parser must define parse method");
  var g = Object.create(generator);
  g.parser = parser;
  return g;
}

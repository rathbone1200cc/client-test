var assert = require('assert'),
    clientTest = require('../client-test'),
    _ = require('lodash')

describe('explode', function(){
  it("should expand variations", function(){
    var variations = {
      food: ['hotdog', 'hamburger'],
      drink: ['coke', 'sprite'],
      side: ['fries', 'chips']
    },
    base = { tag: 'order' }
    ;
    var result = clientTest.explode(base, variations);
    console.log(result);
    assert.equal(result.length, 8);
  });
});

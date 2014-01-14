#!/usr/local/bin/node

var
util = require('util'),
driver = require('./lib/prototypes/driver')
generator = require('./lib/prototypes/generator')
noop = require('./lib/drivers/noop')
program = require('commander')
;

var 
log = console.log,
inspect = function(obj){log(util.inspect(obj));}
;

program
.version('0.1.0')
.option('-c --concurrency <integer>', 'test concurrency (default 1)', parseInt)
.option('-n, --number <integer>', 'number of tests (default to number of tests input)')
.parse(process.argv)
;

inspect(program);

var d = driver(noop);
var test = {};

var g = generator();

d.drive( g.nextTest(), function(){
  log("control returned from driver");
});

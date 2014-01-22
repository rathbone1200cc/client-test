#!/usr/local/bin/node

var
noop = require('./lib/drivers/noop'),
clientTest = require('./client-test')
;

clientTest.addDriver('noop', noop);
clientTest.run();

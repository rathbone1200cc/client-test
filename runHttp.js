#!/usr/local/bin/node

var
nodeHttp = require('./lib/drivers/nodeHttp'),
clientTest = require('./client-test')
;

clientTest(nodeHttp);

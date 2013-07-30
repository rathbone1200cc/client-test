client-test
===========

An extensible web client for functional, comparative, and performance testing.


Key features
------------

- Concurrent GET requests to any URLs (via node http and https libraries)
    - Asserting based on response body, header, status
    - Asserting based on comparison of responses from 2 or more URLs
    - Response perf logging (request start, first byte received, last byte received)
- Concurrent requests with responses loaded by PhantomJS
    - Asserting based on status or phantomjs page object (i.e. executing JS against DOM)
    - Asserting based on comparison of 2 or more URLs via scripting against each page in phantomjs
    - DOM performance logging (request start, DOM load start, DOM load complete, actions within a loaded DOM)
- Built-in support for defining TestDefinitions with a simple URL-per-line format or a more feature-complete JSON format
    - Repro logs are output as JSON and can be re-run
    - Easily extend to parse any input into valid TestDefinitions


Usage
-----

Tested with Node v0.9.x - need to update for phantomjs-node fix that supports later versions

Install PhantomJS (required if using phantomDriver)

Basic usage:

    var clientTest = require(‘client-test’);
    var runOptions = { 
        generatorContext : { inputFile : ‘./input/list-of-urls.txt’ },
        concurrency : 10
    };
    clientTest.run( runOptions, function() { console.log(“Finished testing”); });
    


TODO
----

Document the included components as well as how to extend client-test with new components: (drivers, generators, assertions, comparators).

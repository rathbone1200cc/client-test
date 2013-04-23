
// Default usage of client-test should include the registrations and runner
var clientTest = require('./registration.js')
clientTest.run = require('./runner.js').run

// This way you could choose to use the runner and/or registrations without all the built-in modules
clientTest.registerBuiltInModules()

module.exports = clientTest
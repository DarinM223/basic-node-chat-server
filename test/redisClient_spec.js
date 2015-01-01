'use strict';


describe('Testing redisClient', function() {
  var testingClient = null, normalClient = null;
  before(function() {
    normalClient = require('../redis/redisClient.js')(false); // turn off testing mode
    testingClient = require('../redis/redisClient.js')(true); // turn on testing mode
  });

  it('should return the same instance of normalClient if testing is off', function() {
    if (testingClient !== null && normalClient !== null) {
      var anotherClient = require('../redis/redisClient.js')(false);
      (anotherClient == normalClient).should.equal(true);
    }
  });

  it('should not return the same instance of testingClient if testing is off', function() {
    if (testingClient !== null && normalClient !== null) {
      var anotherClient = require('../redis/redisClient.js')(false);
      (anotherClient == testingClient).should.equal(false);
    }
  });

  it('should return the same instance of testingClient if testing is on', function() {
    if (testingClient !== null && normalClient !== null) {
      var testClient = require('../redis/redisClient.js')(true);
      (testClient == testingClient).should.equal(true);
    }
  });

  it('should not return the same instance of normalClient if testing is on', function() {
    if (testingClient !== null && normalClient !== null) {
      var testClient = require('../redis/redisClient.js')(true);
      (testClient == normalClient).should.equal(false);
    }
  });
});

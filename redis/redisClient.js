var redisClient = null, redisTestClient = null;
var testing = false;

/*
 * Used so that most of the application can use only one 
 * redis client so you don't have a bunch of redis
 * instances open
 *
 * Also used to use a test database if in testing mode
 */

module.exports = function(test) {
  if (test !== null && test === true) {
    testing = true;
  } else if (test !== null && test === false) {
    testing = false;
  }

  if (testing === true) {
    if (redisTestClient === null) {
      redisTestClient = require('fakeredis').createClient();
      // redisTestClient = require('redis').createClient(1234);
    }
    return redisTestClient;
  } else {
    if (redisClient === null) {
      redisClient = require('redis').createClient();
    }
    return redisClient;
  }
};

// module.exports = redisClient;

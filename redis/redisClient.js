var redisClient = null, redisTestClient = null;
var testing = false;

/*
 * Used so that most of the application can use only one 
 * redis client so you don't have a bunch of redis
 * instances open
 *
 * Also used to use a test database if in testing mode
 */

module.exports = function() {
  var test = arguments[0];
  if (test !== null && test === true) {
    testing = true;
  } else if (test !== null && test === false) {
    testing = false;
  }

  if (testing === true) {
    if (redisTestClient === null) {
      var _redis = require('fakeredis');
      redisTestClient = _redis.createClient();
    }
    return redisTestClient;
  } else {
    if (redisClient === null) {
      var _redis = require('redis');
      redisClient = _redis.createClient();
    }
    return redisClient;
  }
};

// module.exports = redisClient;

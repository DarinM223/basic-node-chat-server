var redisClient = null
  , redisTestClient = null
  , redisSubClient = null
  , redisSubTestClient = null;

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
  var sub = arguments[1];

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
    if (redisSubTestClient === null) {
      var _redis = require('fakeredis');
      redisSubTestClient = _redis.createClient();
    }

    if (!sub) {
      return redisTestClient;
    } else {
      return redisSubTestClient;
    }
  } else {
    if (redisClient === null) {
      var _redis = require('redis');
      redisClient = _redis.createClient();
    }
    if (redisSubClient === null) {
      var _redis = require('redis');
      redisSubClient = _redis.createClient();
    }

    if (!sub) {
      return redisClient;
    } else {
      return redisSubClient;
    }
  }
};

// module.exports = redisClient;

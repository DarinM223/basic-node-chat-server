var redisClient = require('redis').createClient();

/*
 * Used so that most of the application can use only one 
 * redis client so you don't have a bunch of redis
 * instances open
 */

module.exports = redisClient;

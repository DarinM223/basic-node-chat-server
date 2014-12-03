'use strict';

var redis = require('redis');
var redisSubClient = redis.createClient();
var socketManager = require('./socketManager.js');

/*
 * Message types:
 * message:userid
 * group:groupid
 */
redisSubClient.on('message', function(channel, message) {
  /*
   * TODO: Implement message handling (send to correct socket)
   */
});

module.exports = redisSubClient;

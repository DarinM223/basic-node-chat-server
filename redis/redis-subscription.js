'use strict';

var redis = require('redis');
var redisSubClient = redis.createClient();
var socketManager = require('./socketManager.js');
var io = null;

function sendUserMessage(message) {
  io.to(message.receiverId).emit('message', message);
}

/*
 * Message types:
 * message:userid
 * group:groupid
 */
redisSubClient.on('message', function(channel, message) {
  var channelArgs = channel.split(':');
  if (channelArgs.length === 3 && channelArgs[0] === 'user' && channelArgs[1] === 'message' && message.receiverId) {
    if (socketManager.hasUserId(message.receiverId)) { // if this server contains the receiver, send through socket
      sendUserMessage(message);
    }
  }  
});

module.exports = function(socketIO) {
  io = socketIO;
  return {
    subClient: redisSubClient
  };
};

'use strict';

/*
 * The socket server that receives data as input
 * and and sends it to socket.js. It also handles the 
 * publications and subscriptions for redis as well as the actual
 * sockets
 */

var io = null;
var redisSubClient = require('redis').createClient();
var redisPubClient = require('redis').createClient();
var sockets = require('./sockets.js');

function onUserLogin(data, callback) {
  sockets.handleUserLogin(this.id, data.username, data.password, function(err, userid) {
    if (!err && result !== null) {
      redisSubClient.subscribe('user:message:'+userid);
      return callback(null, data.username);
    } else {
      return callback(err, result);
    }
  });
}

function onJoinGroup(data, callback) {
  sockets.handleJoinGroup(this.id, data.groupId, callback);
}

function onMessage(data, callback) {
  sockets.handleMessage(this.id, data, function(err, result) {
    if (!err && result !== null && result === true) {
      // if receiver is logged in publish to receiver's subscription
      redisSubClient.get('login:' + data.receiverId, function(err, value) {
        if (value !== null) { 
          redisPubClient.publish('user:message:' + data.receiverId, { type: 'add', message: data });
        } 
      });
    } else {
      return callback(err, result);
    }
  });
}

function onDisconnect() {
  sockets.handleDisconnect(this.id, function(err, userid) {
    // unsubscribe from user's messages
    redisSubClient.unsubscribe('user:message' + userid);
  });
}

module.exports = function(server) {
  io = require('socket.io').listen(server);
  var subscr = require('./redis/redis-subscription.js')(io);
  redisSubClient = subscr.subClient;

  io.sockets.on('connection', function(client) {
    client.on('user:login', onUserLogin.bind(client));
    client.on('user:joingroup', onJoinGroup.bind(client));
    client.on('message', onMessage.bind(client));
    client.on('disconnect', onDisconnect.bind(client));
  });
  return {};
};

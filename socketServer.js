'use strict';

/*
 * The socket server that receives data as input
 * and and sends it to socket.js. It also handles the 
 * publications and subscriptions for redis as well as the actual
 * sockets
 */

var io = null
  , redisPubClient = require('./redis/redisClient.js')()
  , redisSubClient = null
  , socketController = require('./controllers/sockets_controller.js');

/**
 * @property {string} data.username
 * @property {string} data.password
 */
function onUserLogin(data, callback) {
  socketController.handleUserLogin(this.id, data.username, data.password, function(err, userid) {
    if (!err && result !== null) {
      redisSubClient.subscribe('user:message:'+userid);
      return callback(null, data.username);
    } else {
      return callback(err, result);
    }
  });
}

function onJoinGroup(data, callback) {
  socketController.handleJoinGroup(this.id, data.groupId, callback);
}

function onMessage(data, callback) {
  socketController.handleMessage(this.id, data, function(err, result) {
    if (!err && result !== null && result === true) {
      // if receiver is logged in publish to receiver's subscription
      redisSubClient.get('login:' + data.receiverId, function(err, value) {
        if (value !== null) { 
          if (data.receiverId) { // handle individual message
            redisPubClient.publish('user:message:' + data.receiverId, { type: 'add', message: data });
          } else if (data.groupId) { // handle group message
            Group.findById(data.groupId, function(err, group) {
              group.users.map(function(userid) {
                redisPubClient.publish('user:message:' + userid, { type: 'add', message: data });
              });
            });
          }
        } 
      });
    } else {
      return callback(err, result);
    }
  });
}

function onDisconnect() {
  socketController.handleDisconnect(this.id, function(err, userid) {
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

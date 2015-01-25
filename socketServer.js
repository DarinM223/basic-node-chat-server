'use strict';

/*
 * The socket server that receives data as input
 * and and sends it to socket.js. It also handles the 
 * publications and subscriptions for redis as well as the actual
 * sockets
 */

var redisPubClient = require('./redis/redisClient.js')()
  , socketController = require('./controllers/sockets_controller.js');

/**
 * @property {string} data.username
 * @property {string} data.password
 */
function onUserLogin(redisSubClient, data, callback) {
  socketController.handleUserLogin(this.id, data.username, data.password, function(err, userid) {
    if (!err && result !== null) {
      redisSubClient.subscribe('user:message:'+userid);
      return callback(null, data.username);
    } else {
      return callback(err, result);
    }
  });
}

function onMessage(data, callback) {
  socketController.handleMessage(this.id, data, function(err, result) {
    if (!err && result !== null && result === true) {
      // if receiver is logged in publish to receiver's subscription
      redisPubClient.get('login:' + data.receiverId, function(err, value) {
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

function onDisconnect(redisSubClient) {
  socketController.handleDisconnect(this.id, function(err, userid) {
    // unsubscribe from user's messages
    redisSubClient.unsubscribe('user:message' + userid);
  });
}

module.exports = function(server) {
  var io = require('socket.io').listen(server)
    , subscr = require('./redis/redis-subscription.js')(io)
    , redisSubClient = subscr.subClient;

  io.sockets.on('connection', function(client) {
    client.on('user:login', onUserLogin.bind(client, redisSubClient));
    client.on('message', onMessage.bind(client));
    client.on('disconnect', onDisconnect.bind(client, redisSubClient));
  });
  return {};
};

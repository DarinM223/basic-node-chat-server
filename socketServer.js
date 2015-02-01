'use strict';

/*
 * The socket server that receives data as input
 * and and sends it to socket.js. It also handles the 
 * publications and subscriptions for redis as well as the actual
 * sockets
 */

var paths = [
  './controllers/sockets_controller.js'
];

// delete sockets controller cache that messes up testing
for (var i = 0; i < paths.length; i++) {
  var path = require.resolve(paths[i]);
  if (require.cache[path]) {
    delete require.cache[path];
  }
}

var redisClient = require('./redis/redisClient.js')(false)
  , redisPubClient = require('redis').createClient()
  , socketController = require('./controllers/sockets_controller.js')
  , _ = require('underscore')
  , async = require('async')
  , mongoose = require('mongoose')
  , Group = require('./models/Group.js');

/**
 * @property {string} data.username
 * @property {string} data.password
 * @param {function(err,string} callback returns the username of logged in user
 */
function onUserLogin(redisSubClient, socketManager, data, callback) {
  socketController.handleUserLogin(this.id, data.username, data.password, socketManager, function(err, userid) {
    if (!err && userid !== null) {
      redisSubClient.subscribe('user:message:'+userid);
      return callback(null, data.username);
    } else {
      return callback(err);
    }
  });
}

function sendToReceiver(data, callback) {
  redisPubClient.get('login:' + data.receiverId, function(err, value) {
    if (value !== null) {
      redisPubClient.publish('user:message:' + data.receiverId, JSON.stringify({ type: 'add', message: data }));
    }
    if (callback) return callback(err);
  });
}

function onMessage(socketManager, data, callback) {
  socketController.handleMessage(this.id, data, socketManager, function(err, result) {
    if (!err) {
      if (data.receiverId) {
        sendToReceiver(data, callback);
      } else if (data.groupId) {
        Group.findById(data.groupId, function(err, group) {
          // send created user the message
          var message = _.clone(data);
          message.receiverId = group.createdUser;
          sendToReceiver(message);

          // send joined users the message
          group.joinedUsers(function(err, userids) {
            userids.map(function(userid) {
              var newMessage = _.clone(data);
              newMessage.receiverId = userid;
              sendToReceiver(newMessage);
            });
            return callback(err);
          });
        });
      }
    } else {
      return callback(err);
    }
  });
}

function onDisconnect(redisSubClient, socketManager) {
  socketController.handleDisconnect(this.id, socketManager, function(err, userid) {
    // unsubscribe from user's messages
    redisSubClient.unsubscribe('user:message:' + userid);
  });
}

module.exports = function(server) {
  var io = require('socket.io').listen(server)
    , redisSubClient = require('redis').createClient()
    , socketManager = require('./socketManager.js')();

  redisSubClient.on('message', function(channel, messageStr) {
    var channelArgs = channel.split(':');
    var message = JSON.parse(messageStr);
    if (channelArgs.length === 3 && channelArgs[0] === 'user' && 
        channelArgs[1] === 'message' && message.message.receiverId) {
      if (socketManager.hasUserId(message.message.receiverId)) { 
        io.to(socketManager.getSocketId(message.message.receiverId)).emit('message', message);
      }
    }  
  });

  io.sockets.on('connection', function(client) {
    client.on('user:login', onUserLogin.bind(client, redisSubClient, socketManager));
    client.on('message', onMessage.bind(client, socketManager));
    client.on('disconnect', onDisconnect.bind(client, redisSubClient, socketManager));
  });
  return io;
};

'use strict';

/*
 * The socket server that receives data as input
 * and and sends it to socket.js. It also handles the 
 * publications and subscriptions for redis as well as the actual
 * sockets
 */

var async = require('async')
  , _ = require('underscore')
  , SocketManager = require('./SocketManager.js')
  , SocketsController = require('./controllers/sockets_controller.js')
  , Group = require('./models/Group.js');

function SocketServer(io) {
  this.io = io;

  this.socketManager = new SocketManager();
  this.socketController = new SocketsController(this.socketManager);
  this.redisSubClient = require('redis').createClient();
  this.redisPubClient = require('redis').createClient();

  this.redisSubClient.on('message', this.handleMessage.bind(this));
}

SocketServer.prototype.handleMessage = function(channel, messageStr) {
  var channelArgs = channel.split(':');
  var message = JSON.parse(messageStr);
  if (channelArgs.length === 3 && channelArgs[0] === 'user' && 
      channelArgs[1] === 'message' && message.message.receiverId) {
    if (this.socketManager.hasUserId(message.message.receiverId)) { 
      this.io.to(this.socketManager.getSocketId(message.message.receiverId)).emit('message', message);
    }
  }  
};

/**
 * @property {string} data.username
 * @property {string} data.password
 * @param {function(err,string} callback returns the username of logged in user
 */
SocketServer.prototype.onUserLogin = function(client, data, callback) {
  this.socketController.handleUserLogin(client.id, data.username, data.password, function(err, userid) {
    if (!err && userid !== null) {
      this.redisSubClient.subscribe('user:message:'+userid);
      return callback(null, data.username);
    } else {
      return callback(err);
    }
  }.bind(this));
};

SocketServer.prototype._sendToReceiver = function(data, callback) {
  this.redisPubClient.get('login:' + data.receiverId, function(err, value) {
    if (value !== null) {
      this.redisPubClient.publish('user:message:' + data.receiverId, JSON.stringify({ type: 'add', message: data }));
    }
    if (callback) return callback(err);
  }.bind(this));
};

SocketServer.prototype.onMessage = function(client, data, callback) {
  this.socketController.handleMessage(client.id, data, function(err, result) {
    if (err) return callback(err);

    if (data.receiverId) {
      return this._sendToReceiver(data, callback);
    }

    if (data.groupId) {
      var sendToUser = function(userid, callback) {
        var message = _.clone(data);
        message.receiverId = userid;
        this._sendToReceiver(message, callback);
      }.bind(this);

      var sendToJoinedUsers = function(userids, callback) {
        async.map(userids, sendToUser, callback);
      }.bind(this);

      Group.findById(data.groupId, function(err, group) {
        if (err) return callback(err);

        async.waterfall([
          sendToUser.bind(this, group.createdUser),
          group.joinedUsers.bind(group),
          sendToJoinedUsers
        ], function(err) {
          return callback(err);
        });
      }.bind(this));
    }
  }.bind(this));
};

SocketServer.prototype.onDisconnect = function(client) {
  this.socketController.handleDisconnect(client.id, function(err, userid) {
    // unsubscribe from user's messages
    this.redisSubClient.unsubscribe('user:message:' + userid);
  }.bind(this));
};

module.exports = SocketServer;

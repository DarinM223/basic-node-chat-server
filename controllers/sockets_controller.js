/* @flow */
'use strict';

/*
 * Functions to abstract the parts used by the socket server
 * such as logging in, handling messages, joining groups, etc
 * from the actual socket server
 */

var User = require('../models/User.js')
  , Chat = require('../models/Chat.js')
  , Group = require('../models/Group.js')
  , mongoose = require('mongoose')
  , async = require('async');

function SocketsController(socketManager) {
  this.socketManager = socketManager;
  this.redisClient = require('../redis/redisClient.js')(false);
}

/**
 * Adds socketid/userid pairing and sets the redis login key
 * TODO: expire login key
 * @param {string} socketid
 * @param {string} userid
 * @param {function(err,string)} callback
 */
SocketsController.prototype._setLoginKey = function(socketid, userid, callback) {
  this.socketManager.addPairing(socketid, userid);
  this.redisClient.set('login:' + mongoose.Types.ObjectId(userid), 1, function(err) {
    return callback(err, userid);
  });
};

/**
 * @param {string} socketid
 * @param {string} username
 * @param {string} password
 * @param {function(err,string)} callback return the user id of the logged in user
 */
SocketsController.prototype.handleUserLogin = function(socketid, username, password, callback) {
  var that = this;

  var verifyUser = function(callback) {
    User.verify(username, password, function(err, user) {
      if (user === null) return callback(new Error('Your username or password was incorrect'));
      return callback(err, user);
    });
  };

  var checkLoggedIn = function(user, callback) {
    that.redisClient.get('login:' + user._id, function(err, value) {
      if (err) return callback(err);
      if (value !== null || value === 0) return callback(new Error('You have already logged in'));

      return that._setLoginKey(socketid, user._id, callback);
    });
  };

  // verify user from username and password
  async.waterfall([
    verifyUser,
    checkLoggedIn
  ], callback);
};

/**
 * @param {string} socketid
 * @param {Chat} chatMessage
 * @param {function(err,boolean)} callback
 */
SocketsController.prototype.handleMessage = function(socketid, chatMessage, callback) {
  var that = this;

  var userid = this.socketManager.getUserId(socketid);

  var checkLoggedIn = function(callback) {
    that.redisClient.get('login:' + userid, function(err, value) {
      if (value === null) return callback(new Error('You are not logged in'));
      return callback(err);
    });
  };

  var createMessage = function(callback) {
    if (chatMessage.receiverId || chatMessage.groupId) {
      Chat.new(chatMessage, callback);
    }
  };

  async.waterfall([
    checkLoggedIn,
    createMessage
  ], callback);
};

/**
 * @param {string} socketid
 * @param {function(err,string)} callback returns the user id of the disconnected user
 */
SocketsController.prototype.handleDisconnect = function(socketid, callback) {
  if (this.socketManager.hasSocketId(socketid)) {
    var disconnected_uid = this.socketManager.getUserId(socketid);
    this.socketManager.removePairing(socketid);

    // remove keys with the user id
    this.redisClient.del('login:'+disconnected_uid, function(err) {
      return callback(err, disconnected_uid); // unsubscribe from user id even if setting key fails
    });
  } else {
    return callback(new Error('There is no user associated with this socket id'), null);
  }
};

SocketsController.prototype.resetEverything = function() {
  User.collection.remove({}, function(err, result) {});
  this.socketManager.reset();
};

module.exports = SocketsController;

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
  , async = require('async')
  , redisClient = require('../redis/redisClient.js')();

/**
 * Adds socketid/userid pairing and sets the redis login key
 * TODO: expire login key
 * @param {string} socketid
 * @param {string} userid
 * @param {socketManager} socketManager
 * @param {function(err,string)} callback
 */
function setLoginKey(socketid, userid, socketManager, callback) {
  socketManager.addPairing(socketid, userid);
  redisClient.set('login:' + mongoose.Types.ObjectId(userid), 1, function(err) {
    return callback(err, userid);
  });
}

/**
 * @param {string} socketid
 * @param {string} username
 * @param {string} password
 * @param {socketManager} socketManager
 * @param {function(err,string)} callback return the user id of the logged in user
 */
exports.handleUserLogin = function handleUserLogin(socketid, username, password, socketManager, callback) {
  // verify user from username and password
  async.waterfall([
    function verifyUser(callback) {
      User.verify(username, password, function(err, user) {
        if (user === null) return callback(new Error('Your username or password was incorrect'));
        return callback(err, user);
      });
    },
    function checkLoggedIn(user, callback) {
      redisClient.get('login:' + user._id, function(err, value) {
        if (err) return callback(err);
        if (value !== null || value === 0) return callback(new Error('You have already logged in'), false);

        return setLoginKey(socketid, user._id, socketManager, callback);
      });
    }
  ], function(err, userid) {
    return callback(err, userid);
  });
};

/**
 * @param {string} socketid
 * @param {Chat} chatMessage
 * @param {function(err,boolean)} callback
 */
exports.handleMessage = function handleMessage(socketid, chatMessage, socketManager, callback) {
  var userid = socketManager.getUserId(socketid);
  async.waterfall([
    function checkLoggedIn(callback) {
      redisClient.get('login:' + userid, function(err, value) {
        if (err) return callback(err);
        if (value === null) return callback(new Error('You are not logged in'));
        return callback(err, value);
      });
    },
    function createMessage(value, callback) {
      if (chatMessage.receiverId || chatMessage.groupId) {
        Chat.new(chatMessage, function(err, result) {
          return callback(err, result);
        });
      }
    }
  ], function(err, result) {
    return callback(err, result);
  });
};

/**
 * @param {string} socketid
 * @param {function(err,string)} callback returns the user id of the disconnected user
 */
exports.handleDisconnect = function handleDisconnect(socketid, socketManager, callback) {
  if (socketManager.hasSocketId(socketid)) {
    var disconnected_uid = socketManager.getUserId(socketid);
    socketManager.removePairing(socketid);

    // remove keys with the user id
    redisClient.del('login:'+disconnected_uid, function(err) {
      return callback(err, disconnected_uid); // unsubscribe from user id even if setting key fails
    });
  } else {
    return callback(new Error('There is no user associated with this socket id'), null);
  }
};

exports.resetEverything = function resetEverything(socketManager) {
  User.collection.remove({}, function(err, result) {});
  socketManager.reset();
};

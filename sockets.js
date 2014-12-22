/* @flow */
'use strict';

/*
 * Functions to abstract the parts used by the socket server
 * such as logging in, handling messages, joining groups, etc
 * from the actual socket server
 */

var User = require('./models/User.js');
var database = require('./database.js');
var socketManager = require('./socketManager.js');
var Group = require('./models/Group.js');

var mongoose = require('mongoose');

var redisClient = require('./redis/redisClient.js')();

var redisManager = require('./redisManager.js');

/**
 * Adds socketid/userid pairing and sets the redis login key
 * TODO: expire login key
 * @param {string} socketid
 * @param {string} userid
 * @param {function(err,string)} callback
 */
function setLoginKey(socketid, userid, callback) {
  socketManager.addPairing(socketid, userid);
  redisClient.set('login:' + userid, 1, function(err) {
    if (err) {
      return callback(err, false);
    } else {
      return callback(null, userid);
    }
  });
}

/**
 * @param {string} socketid
 * @param {string} username
 * @param {string} password
 * @param {function(err,string)} callback return the user id of the logged in user
 */
exports.handleUserLogin = function handleUserLogin(socketid, username, password, callback) {
  // verify user from username and password
  database.verifyUser(username, password, function(err, user) {
    if (err) {
      return callback(err, false);
    } else if (user) {
      // check if user is already logged in through redis
      redisClient.get('login:' + user._id, function(err, value) {
        if (err) { 
          return callback(err, false);
        } else if (value !== null || value === false) { // already logged in 
          return callback(new Error('You have already logged in'), false);
        } else { // not logged in
          return setLoginKey(socketid, user._id, callback);
        }
      });
    } else {
      return callback(new Error('Your username or password was incorrect'), false);
    }
  });
};

/**
 * Adds a new user to a group
 * @param {string} groupId
 * @param {string} userId
 * @param {function(err,boolean)} callback
 */
function addUserToGroup(groupId, userId, callback) {
  Group.update({ _id: mongoose.Types.ObjectId(groupId) }, {
    $addToSet: {
      users: userId
    }
  }, { multi: true }, function(err) {
    if (err) {
      return callback(err, false);
    }
    redisClient.sismember('group:' + groupId, userId, function(err, result) {
      if (err) {
        return callback(err, false);
      }
      if (result === 1) {
        return callback(null, false);
      } else {
        redisClient.sadd('group:' + groupId, userId, function(err) {
          if (err) {
            return callback(err, false);
          }
          return callback(null, true);
        });
      }
    });
  });
}

/**
 * @param {string} socketid
 * @param {string} groupId
 * @param {function(err,boolean)} callback
 */
exports.handleJoinGroup = function handleJoinGroup(socketid, groupId, callback) {
  var userid = socketManager.getUserId(socketid);

  redisClient.get('login:' + userid, function(err, value) {
    if (err) {
      return callback(err, false);
    } else if (value !== null) { // if logged in
      redisManager.hasGroup(groupId, function(err, result) {
        if (!err && result) {
          return addUserToGroup(groupId+'', userid+'', callback);
        } else {
          return callback(new Error('Group does not exist'), false);
        }
      });
    } else {
      return callback(new Error('You are not logged in'), false);
    }
  });
};

/**
 * @param {string} groupId
 * @param {string} userId
 * @param {function(err,boolean)} callback
 */
function removeUserFromGroup(groupId, userId, callback) {
  /**
   * Remove user from the group
   */
}

/**
 * @param {string} socketid
 * @param {string} groupId
 * @param {function(err,boolean)} callback}
 */
exports.handleLeaveGroup = function handleLeaveGroup(socketid, groupId, callback) {
  var userid = socketManager.getUserId(socketid);

  redisClient.get('login:' + userid, function(err, value) {
    if (err) {
    } else if (value !== null) {
      redisManager.hasGroup(groupId, function(err, result) {
        if (!err && result) {
          return removeUserFromGroup(groupId+'', userid+'', callback);
        } else {
          return callback(new Error('Group does not exist'), false);
        }
      });
    } else {
      return callback(new Error('You are not logged in'), false);
    }
  });
};

/**
 * @param {string} socketid
 * @param {Chat} chatMessage
 * @param {function(err,boolean)} callback
 */
exports.handleMessage = function handleMessage(socketid, chatMessage, callback) {
  var userid = socketManager.getUserId(socketid);
  redisClient.get('login:' + userid, function(err, value) {
    if (err) {
      return callback(err, false);
    } else if (value !== null) { // logged in
      if (chatMessage.receiverId) { // if data is an individual message
        redisManager.addIndividualMessage(chatMessage, function(err, result) {
          if (!err && result !== null && result === true) {
            return callback(null, true);
          }
          return callback(err, false);
        }); 
      } else if (chatMessage.groupId) { // if data is a group message
        redisManager.addGroupMessage(chatMessage, function(err, result) {
          if (!err && result !== null && result === true) {
            return callback(null, true);
          }
          return callback(err, false);
        });
      } else { // not valid message
        return callback(new Error('Message is not valid'), false);
      }
    } else { // not logged in
      return callback(new Error('You are not logged in'), false);
    }
  });
};

/**
 * @param {string} socketid
 * @param {function(err,string)} callback returns the user id of the disconnected user
 */
exports.handleDisconnect = function handleDisconnect(socketid, callback) {
  if (socketManager.hasSocketId(socketid)) {
    var disconnected_uid = socketManager.getUserId(socketid);
    socketManager.removePairing(socketid);

    // remove keys with the user id
    redisClient.del('login:'+disconnected_uid, function(err) {
      return callback(err, disconnected_uid); // unsubscribe from user id even if setting key fails
    });
  }
};

exports.resetEverything = function resetEverything() {
  User.collection.remove({}, function(err, result) {});
  socketManager.reset();
};

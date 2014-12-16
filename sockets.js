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

var redisClient = require('./redis/redisClient.js')();

var redisManager = require('./redisManager.js');

/**
 * @param {string} socketid
 * @param {string} username
 * @param {string} password
 * @param {function(err,string} callback return the user id of the logged in user
 */
exports.handleUserLogin = function(socketid, username, password, callback) {
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
          socketManager.addPairing(socketid, user._id);
          redisClient.subscribe('user:message:' + user._id);
          redisClient.set('login:' + user._id, true, function(err) {
            if (err) {
              return callback(err, false);
            }
          });

          return callback(null, userid);
        }
      });
    } else {
      return callback(new Error('Your username or password was incorrect'), false);
    }
  });
};

/**
 * @param {string} socketid
 * @param {string} groupId
 * @param {function(err,boolean)} callback
 */
exports.handleJoinGroup = function(socketid, groupId, callback) {
  var userid = socketManager.getUserId(socketid);

  redisClient.get('login:' + userid, function(err, value) {
    if (err) {
      return callback(err, false);
    } else if (value !== null) { // if logged in
      redisManager.hasGroup(groupId, function(err, result) {
        if (!err && result) {
          Group.update({ _id: groupId }, {
            $addToSet: {
              users: userid
            }
          }, { multi: true }, function(err, result) {
              if (err || !result) {  // error updating groups
                callback(new Error('Error updating database'), false);
              } else {
                redisClient.sadd('group:' + groupId, userid, function(err, result) {
                  if (err) {
                    return callback(err, false);
                  } else {
                    if (result === 1) {
                      return callback(null, true);
                    } else { // user already in group
                      return callback(new Error('You are already in this group'), false);
                    }
                  }
                });
              }
          });
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
exports.handleMessage = function(socketid, chatMessage, callback) {
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
exports.handleDisconnect = function(socketid, callback) {
  if (socketManager.hasSocketId(socketid)) {
    var disconnected_uid = socketManager.getUserId(socketid);
    socketManager.removePairing(socketid);

    // remove keys with the user id
    redisClient.del('login:'+disconnected_uid, function(err) {
      return callback(err, disconnected_uid); // unsubscribe from user id even if setting key fails
    });
  }
};

exports.resetEverything = function() {
  User.collection.remove({}, function(err, result) {});
  socketManager.reset();
};

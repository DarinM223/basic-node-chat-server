'use strict';

/*
 * Functions to abstract the message handling parts of the application
 * like adding, editing, and removing (TODO) so that it can be used anywhere
 */

var Chat = require('./models/Chat.js');
var redisClient = require('./redis/redisClient.js');

exports.addGroupMessage = function(senderid, message, callback) {
  /*
   * TODO: Add message to the groups message and do addIndividualMessage to all userids in the group
   */
};

/**
 * Add individual message to both mongo and redis
 * @param {Chat} message the message to add
 * @param {function(err,boolean)} callback 
 */
exports.addIndividualMessage = function(message, callback) {
  // add message to mongo if succeeds, then add to redis
  var dbMessage = new Chat({
    senderId: message.senderId,
    receiverId: message.receiverId,
    groupId: message.groupId,
    message: message.message,
  });
  dbMessage.save(function(err, doc) {
    if (err) {
      return callback(err, false);
    } else {
      // add message to redis
      redisClient.set('message:' + doc._id, doc, function(err) {
        if (err) return callback(err, false);
        else {
          // update number of unread messages
          redisClient.get('user:unread:' + doc.receiverId, function(err, value) {
            if (err) {
              return callback(err, false);
            } 
            if (value === null) { // if unread messages is not cached in redis, cache it
              Chat.find({ receiverId: doc.receiverId, read: false }).count(function(err, count) {
                if (err) return callback(err, false);
                redisClient.set('user:unread:' + doc.receiverId, count, function(err) {
                  if (err) return callback(err, false);
                  return callback(null, true);
                });
              });
            } else { // otherwise, increment the cached value
              redisClient.incr('user:unread:' + doc.receiverId, function(err) {
                if (err) return callback(err, false);
                return callback(null, true);
              });
            }
          });
        }
      });
    }
  });
};

exports.editGroupMessage = function(groupid, messageid, message, callback) {
  /*
   * TODO: check if messageid is in the group's messages, if it is, edit the message in both redis and mongodb, then send editIndividualMessage to all members of the group
   */
};

/**
 * Edits individual message in both mongodb and redis
 * @param {Chat} message message to replace with
 * @param {function(err,boolean)} callback
 */
exports.editIndividualMessage = function(message, callback) {
  Chat.update({ _id: message._id }, { message: message }, function(err, result) {
    if (err || !result) {
      return callback(err, false);
    } else {
      redisClient.set('message:' + message._id, message, function(err) {
        if (err) {
          return callback(err, false);
        } else {
          return callback(err, true);
        }
      });
    }
  });
};

/**
 * Checks if group already exists
 * @param {string} groupid
 * @param {function(err,boolean)} callback
 */
exports.hasGroup = function(groupid, callback) {
  var Group = require('./models/Group.js');
  redisClient.exists('group:' + groupid, function(err, result) {
    if (err) {
      return callback(err, false);
    } else if (result) { // group already in cache
      return callback(null, true);
    } else { // group not in cache, check database
      Group.find({ _id: groupid }, function(err, result) {
        return callback(err, (result !== null));
      });
    }
  });
};

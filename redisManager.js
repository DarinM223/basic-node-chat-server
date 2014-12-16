'use strict';

/*
 * Functions to abstract the message handling parts of the application
 * like adding, editing, and removing (TODO) so that it can be used anywhere
 */

var Chat = require('./models/Chat.js');
var redisClient = require('./redis/redisClient.js')();

exports.addGroupMessage = function(senderid, message, callback) {
  /*
   * TODO: Add message to the groups message and do addIndividualMessage to all userids in the group
   */
};

/**
 * Add individual message to both mongo and redis
 * @param {Chat} message the message to add
 * @param {function(err,ObjectId)} callback returns the added message id or null if failed
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
      return callback(err, null);
    } else {
      // add message to redis
      redisClient.set('message:' + doc._id, JSON.stringify(doc), function(err) {
        if (err) return callback(err, null);
        else {
          // update number of unread messages
          redisClient.get('user:unread:' + doc.receiverId, function(err, value) {
            if (err) {
              return callback(err, null);
            } 
            if (value === null) { // if unread messages is not cached in redis, cache it
              Chat.find({ receiverId: doc.receiverId, read: false }).count(function(err, count) {
                if (err) return callback(err, null);
                redisClient.set('user:unread:' + doc.receiverId, count, function(err) {
                  if (err) return callback(err, null);
                  return callback(null, doc._id);
                });
              });
            } else { // otherwise, increment the cached value
              redisClient.incr('user:unread:' + doc.receiverId, function(err) {
                if (err) return callback(err, null);
                return callback(null, doc._id);
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
 * Edits an individual message in both mongodb and redis
 * @param {ObjectId/string} messageid id of message to replace with
 * @param {string} message message to replace with
 * @param {function(err,boolean)} callback
 */
exports.editIndividualMessage = function(messageid, message, callback) {
  Chat.findOneAndUpdate({ _id: messageid }, {$set: {message: message}}, { new: true }, function(err, result) {
    if (err || !result) return callback(err, false);
    redisClient.set('message:' + messageid, JSON.stringify(result), function(err) {
      if (err) return callback(err, false);
      return callback(err, true);
    });
  });
};

/**
 * Checks if group already exists
 * @param {ObjectId/string} groupid
 * @param {function(err,boolean)} callback
 */
exports.hasGroup = function(groupid, callback) {
  var Group = require('./models/Group.js');
  redisClient.exists('group:' + groupid, function(err, result) {
    if (err) {
      return callback(err, false);
    } else if (result) { // group already in cache
      return callback(null, true);
    } else { // group not in cache, check database and add to cache
      Group.findById(groupid, function(err, result) {
        if (result === null) return callback(null, false);
        redisClient.set('group:' + groupid, JSON.stringify(result), function(err, success) {
          if (err || !success) return callback(err, false);
          return callback(null, true);
        });
      });
    }
  });
};

'use strict';

/*
 * Functions to abstract the message handling parts of the application
 * like adding, editing, and removing (TODO) so that it can be used anywhere
 */

var Chat = require('./models/Chat.js');
var Group = require('./models/Group.js');
var redisClient = require('./redis/redisClient.js')();
var async = require('async');

exports.addGroupMessage = function addGroupMessage(senderid, message, callback) {
  /*
   * TODO: Add message to the groups message and do addIndividualMessage to all userids in the group
   */
};

/**
 * Add individual message to both mongo and redis
 * @param {Chat} message the message to add
 * @param {function(err,ObjectId)} callback returns the added message id or null if failed
 */
exports.addIndividualMessage = function addIndividualMessage(message, callback) {
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

exports.editGroupMessage = function editGroupMessage(groupid, messageid, message, callback) {
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
exports.editIndividualMessage = function editIndividualMessage(messageid, message, callback) {
  Chat.findOneAndUpdate({ _id: messageid }, {$set: {message: message}}, { new: true }, function(err, result) {
    if (err || !result) return callback(err, false);
    redisClient.set('message:' + messageid, JSON.stringify(result), function(err) {
      if (err) return callback(err, false);
      return callback(err, true);
    });
  });
};

function initRedisGroup(groupId, callback) {
  Group.findById(groupId, function(err, result) {
    if (result === null) {
      callback(err, false);
    } else {
      // first add the user who created the group to the set
      redisClient.sadd('group:' + groupId, (result.createdUser+''), function(err) {
        if (err) {
          return callback(err, false);
        }
        // then add every joined user to the set
        async.each(result.users, function(userid, callback) {
          redisClient.sadd('group:' + groupId, userid+'', function(err) {
            if (err) {
              return callback(err);
            }
            return callback();
          });
        }, function(err) {
          if (err) {
            return callback(err, false);
          } else {
            return callback(null, true);
          }
        });
      });
    }
  });
}

/**
 * Checks if group already exists
 * @param {ObjectId/string} groupid
 * @param {function(err,boolean)} callback
 */
exports.hasGroup = function hasGroup(groupid, callback) {
  redisClient.exists('group:' + groupid, function(err, result) {
    if (err) {
      return callback(err, false);
    } else if (result) { // group already in cache
      return callback(null, true);
    } else { // group not in cache, check database and add to cache
      initRedisGroup(groupid, callback);
    }
  });
};

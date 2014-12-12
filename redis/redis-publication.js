'use strict';

var redis = require('redis');
var Chat = require('../models/Chat.js');

var io = null;

var redisPubClient = redis.createClient();

redisPubClient.addGroupMessage = function(senderid, message, callback) {
  var pub = this;

  /*
   * TODO: Add message to the groups message and do addIndividualMessage to all userids in the group
   */
};

/**
 * Add individual message to both mongo and redis
 * @param message {Chat} the message to add
 * @param callback {function(err,boolean)}
 */
redisPubClient.addIndividualMessage = function(message, callback) {
  var pub = this;

  pub.get('login:' + message.receiverId, function(err, value) {
    if (err) {
      return callback(err, null);
    } 
    if (value !== null) { // if receiver is logged in publish to receiver's subscription
      redisPubClient.publish('user:message:' + message.receiverId, message);
    } 
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
        redisPubClient.set('message:' + doc._id, doc, function(err) {
          if (err) return callback(err, null);
          else {
            // update number of unread messages
            redisPubClient.get('user:unread:' + doc.receiverId, function(err, value) {
              if (err) {
                return callback(err, null);
              } 
              if (value === null) { // if unread messages is not cached in redis, cache it
                Chat.find({ receiverId: doc.receiverId, read: false }).count(function(err, count) {
                  if (err) return callback(err, null);
                  redisPubClient.set('user:unread:' + doc.receiverId, count, function(err) {
                    if (err) return callback(err, null);
                    return callback(null, true);
                  });
                });
              } else { // otherwise, increment the cached value
                redisPubClient.incr('user:unread:' + doc.receiverId, function(err) {
                  if (err) return callback(err, null);
                  return callback(null, true);
                });
              }
            });
          }
        });
      }
    });
  });
};

redisPubClient.editGroupMessage = function(groupid, messageid, message, callback) {
  var pub = this;
  /*
   * TODO: check if messageid is in the group's messages, if it is, edit the message in both redis and mongodb, then send editIndividualMessage to all members of the group
   */
};

/**
 * Edits individual message in both mongodb and redis
 * @param message {Chat} message to replace with
 * @param callback {function(err, boolean)} callback
 */
redisPubClient.editIndividualMessage = function(message, callback) {
  var pub = this;

  Chat.update({ _id: message._id }, { message: message }, function(err, result) {
    if (err || !result) {
      return callback(err, null);
    } else {
      redisPubClient.set('message:' + message._id, message, function(err) {
        if (err) {
          return callback(err, null);
        } else {
          return callback(err, true);
        }
      });
    }
  });
};

module.exports = function(socketIO) {
  io = socketIO;
  return {
    pubClient: redisPubClient
  };
};

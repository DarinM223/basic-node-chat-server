'use strict';

var redis = require('redis');
var Chat = require('../models/Chat.js');

var io = null;

var redisPubClient = redis.createClient();

redisPubClient.addGroupMessage = function(senderid, message) {
  var pub = this;

};

/**
 * Add individual message to redis
 * Assume that you are already logged in
 */
redisPubClient.addIndividualMessage = function(message) {
  var pub = this;

  pub.get('login:' + message.receiverId, function(err, value) {
    if (err) {
      console.log(err);
      return false;
    } 
    if (value !== null) { // if receiver is logged in publish to receiver's subscription
      redisPubClient.publish('user:message:' + message.receiverId, message);
    } 
    /*
     * TODO: add message to mongodb and redis add number of unread messages to mongo and redis
     */
    // add message to mongo if succeeds, then add to redis
    var dbMessage = new Chat({
      senderId: message.senderId,
      receiverId: message.receiverId,
      groupId: message.groupId,
      message: message.message,
    });
    dbMessage.save(function(err, doc) {
      if (err) {
        return false;
      } else {
        redisPubClient.set('message:' + doc._id, doc, function(err) {
          if (err) return false;
          else {
          }
        });
      }
    });
  });
};

redisPubClient.editGroupMessage = function(groupid, messageid, message) {
  var pub = this;
  /*
   * TODO: check if messageid is in the group's messages, if it is, edit the message in both redis and mongodb, then send editIndividualMessage to all members of the group
   */
};

redisPubClient.editIndividualMessage = function(receiverid, messageid, message) {
  var pub = this;
  /*
   * TODO: edit the message in both redis and mongodb (mongo first, then redis if it succeeds)
   */
  /*
   * TODO: check if sent from group message (check if groupId is present). If it isn't, send a edit message to the id
   */
  Chat.update({ _id: messageid }, { message: message }, function(err, result) {
    if (err || !result) {
      return false;
    } else {
    }
  });
  Chat.findOne({ _id: messageid }, function(err, chat) {
    if (err || !chat) {
      return false;
    } else {
      return true;
    }
  });
};

module.exports = function(socketIO) {
  io = socketIO;
  return {
    pubClient: redisPubClient
  };
};

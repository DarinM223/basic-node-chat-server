'use strict';

var mongoose = require('mongoose');
var redisClient = require('../redis/redisClient.js')();

var ChatSchema = mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, required: false, ref: 'User' },
  groupId: { type: mongoose.Schema.Types.ObjectId, required: false, ref: 'Group' },
  message: { type: String },
  read: { type: Boolean , default: false }, 

  created:  { type: Date, default: Date.now }
}); 

/**
 * Edits a message in both mongodb and redis
 * @param {string} message message to replace with
 * @param {function(err,boolean)} callback
 */
ChatSchema.methods.edit = function editMessage(message, callback) {
  var chatMessage = this;
  chatMessage.message = message;
  chatMessage.save(function(err, result) {
    if (err) {
      return callback(err, false);
    } else if (!result) {
      return callback(new Error('Error saving message'), false);
    }
    return callback(err, true);
  });
};

/**
 * Add message to both mongo and redis
 * @param {Chat} message the message to add
 * @param {function(err,Chat)} callback returns the added message
 */
ChatSchema.statics.new = function addMessage(message, callback) {
  var Chat = this;

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
    } else if (!doc) {
      return callback(new Error('Error saving document'), null);
    }
    Chat.incrementUnreadMessages(doc.receiverId, function(err) {
      return callback(err, (err === null ? doc : null));
    });
  });
};

/**
 * Increments a User's unread messages
 * @param {string} userid
 * @param {function(err,integer)} callback returns the new count
 */
ChatSchema.statics.incrementUnreadMessages = function incrementUnreadMessages(userid, callback) {
  var Chat = this;
  // update number of unread messages
  redisClient.get('user:unread:' + userid, function(err, value) {
    if (err) {
      return callback(err, null);
    } 
    if (value === null) { // if unread messages is not cached in redis, cache it
      Chat.find({ receiverId: userid, read: false }).count(function(err, count) {
        if (err) {
          return callback(err, null);
        }
        if (count === null) {
          return callback(new Error('Error finding chat messages'), null);
        }
        redisClient.set('user:unread:' + userid, count, function(err) {
          return callback(err, count);
        });
      });
    } else { // otherwise, increment the cached value
      redisClient.incr('user:unread:' + userid, function(err, newCount) {
        return callback(err, newCount);
      });
    }
  });
};

module.exports = mongoose.model('ChatMessage', ChatSchema);

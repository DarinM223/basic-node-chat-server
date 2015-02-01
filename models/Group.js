'use strict';

var mongoose = require('mongoose')
  , redisClient = require('../redis/redisClient.js')()
  , JoinedUser = require('./JoinedUser.js')
  , async = require('async');

var GroupSchema = new mongoose.Schema({
  createdUser: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
  name: { type: String, required: true },
  created: { type: Date, default: Date.now }
});

/**
 * Checks if a given group exists
 * @param {string} groupid
 * @param {function(err, boolean)} callback
 */
GroupSchema.statics.exists = function hasGroup(groupid, callback) {
  var Group = this;

  this.findById(groupid, function(err, group) {
    if (err) {
      return callback(err, false);
    }
    if (group === null) {
      return callback(null, false);
    }
    return callback(null, true);
  });
};

/**
 * Gets a list of joined users
 * @param {function(err, Array.<ObjectId>} callback returns a list of user ids
 */
GroupSchema.methods.joinedUsers = function(callback) {
  JoinedUser.find({ groupId: this._id }, function(err, docs) {
    return callback(err, docs.map(function(doc) { return doc.userId; }));
  });
};

module.exports = mongoose.model('Group', GroupSchema);

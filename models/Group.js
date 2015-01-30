'use strict';

var mongoose = require('mongoose')
  , redisClient = require('../redis/redisClient.js')()
  , async = require('async');

var GroupSchema = new mongoose.Schema({
  createdUser: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
  name: { type: String, required: true },
  created: { type: Date, default: Date.now },
  users: [] 
});

/**
 * Adds a user to the group
 * @param {string} userid
 * @param {function(err, boolean)} callback
 */
GroupSchema.methods.addUser = function addUser(userid, callback) {
  var Group = this.model('Group');
  if (this.createdUser.equals(mongoose.Types.ObjectId(userid))) {
    return callback(new Error('User already in group'), false);
  } else if (this.users.indexOf(mongoose.Types.ObjectId(userid)) > -1) {
    return callback(new Error('User already in group'), false);
  }

  Group.update({ _id: mongoose.Types.ObjectId(this._id) }, {
    $addToSet: {
      users: userid
    }
  }, { multi: true }, function(err, numChanged) {
    if (err) return callback(err);
    if (numChanged === 1) return callback(null);
    else return callback(new Error('More than one group updated'));
  });
};

GroupSchema.methods.removeUser = function removeUser(userid, callback) {
  /*
   * TODO: implement this
   */
  Group.update({ _id: this._id }, {
    $pull: {
      users: removeIndex
    }
  }, function(err) {
    return callback(err);
  });
};

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

module.exports = mongoose.model('Group', GroupSchema);

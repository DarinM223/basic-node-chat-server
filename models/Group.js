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

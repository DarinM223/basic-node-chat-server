'use strict';

var mongoose = require('mongoose')
  , async = require('async');

var JoinedUserSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  groupId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Group' },
  created: { type: Date, default: Date.now }
});

module.exports = mongoose.model('JoinedUser', JoinedUserSchema);

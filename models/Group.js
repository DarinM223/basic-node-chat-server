'use strict';

var mongoose = require('mongoose');

var GroupSchema = new mongoose.Schema({
  createdUser: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  created: { type: Date, default: Date.now },
  users: [] 
});

module.exports = mongoose.model('Group', GroupSchema);

'use strict';

var mongoose = require('mongoose');

var ChatSchema = mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, required: false },
  groupId: { type: mongoose.Schema.Types.ObjectId, required: true },
  message: { type: String },

  created:  { type: Date, default: Date.now }
}); 

module.exports = mongoose.model('ChatMessage', ChatSchema);

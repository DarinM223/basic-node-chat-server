'use strict';

var mongoose = require('mongoose');

var ChatSchema = mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, required: false },
  // groupId: { type: mongoose.Schema.Types.ObjectId, required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId },
  message: { type: String },
  read: { type: Boolean , default: false }, 

  created:  { type: Date, default: Date.now }
}); 

module.exports = mongoose.model('ChatMessage', ChatSchema);

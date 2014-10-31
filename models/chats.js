'use strict';

var mongoose = require('mongoose');

var ChatSchema = mongoose.Schema({
  sender: { type: String },
  receiver: { type: String },
  message: { type: String },
  created:  { type: Date, default: Date.now }
}); 

module.exports = mongoose.model('ChatMessage', ChatSchema);

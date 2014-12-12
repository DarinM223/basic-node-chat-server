'use strict';

var mongoose = require('mongoose');
var encryption = require('../encryption.js');

var UserSchema = mongoose.Schema({
  // enforce username uniqueness
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  created: { type: Date, default: Date.now },
});

UserSchema.pre('save', function(next) {
  var user = this;

  // only hash password if the password field has been modified
  if (!user.isModified('password')) {
    next();
  } else {
    encryption.cryptPassword(user.password, function (err, hash) {
      if (err) {
        next(err);
      } else {
        user.password = hash;
        next();
      }
    });
  }
});

/**
 * compares a password to the user's hashed password
 * @param {string} comparePassword
 * @param {function(err, boolean)} callback
 * @return {function(err, boolean)}
 */
UserSchema.methods.comparePassword = function(comparePassword, callback) {
  encryption.comparePassword(comparePassword, this.password, function(err, isPasswordMatch) {
    return callback(err, isPasswordMatch);
  });
};

module.exports = mongoose.model('User', UserSchema);

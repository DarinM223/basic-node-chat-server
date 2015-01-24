'use strict';

var mongoose = require('mongoose')
  , encryption = require('../encryption.js')
  , Chat = require('./Chat.js')
  , redisClient = require('../redis/redisClient.js')();

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


/**
 * Adds a new user
 * @param {string} username
 * @param {string} password
 * @param {function(err,boolean)} callback
 */
UserSchema.statics.new = function newUser(username, password, callback) {
  var _user = new this({
    'username': username,
    'password': password
  });
  _user.save(function(err) {
    if (err) {
      // 11000 is uniqueness validation error for new objects
      // 11001 is uniqueness validation error for existing objects
      if (11000 === err.code || 11001 === err.code) {
        return callback(null, false);
      }
      return callback(err, false);
    }
    return callback(null, true);
  });
};

/**
 * Verify if the username/password matches a user
 * @param {string} username
 * @param {string} password
 * @param {function(err,User)} callback
 */
UserSchema.statics.verify = function verifyUser(username, password, callback) {
  this.findOne({ 'username': username }, function(err, user) {
    // if the username does not exist, return false
    if (err || !user) {
      return callback(err, null);
    }
    user.comparePassword(password, function(err, isPasswordMatch) {
      if (isPasswordMatch) {
        return callback(err, user);
      }
      return callback(err, null);
    });
  });
};

module.exports = mongoose.model('User', UserSchema);

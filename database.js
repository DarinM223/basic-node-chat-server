/* @flow */
'use strict';

/*
 * Functions to abstract database functionality like
 * logging in, signing up, and checking groups from the application
 */

var User = require('./models/User.js');
var socketManager = require('./socketManager.js');

/**
 * Adds a new user
 * @param {string} username
 * @param {string} password
 * @param {function(err,boolean)} callback
 */
exports.insertUser = function(username, password, callback) {
  var newUser = new User({
    'username': username,
    'password': password
  });
  newUser.save(function(err) {
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
exports.verifyUser = function(username, password, callback) {
  User.findOne({ 'username': username }, function(err, user) {
    // if the username does not exist, return false
    if (err || !user) {
      return callback(err, null);
    }
    user.comparePassword(password, function(err, isPasswordMatch) {
      return callback(err, user);
    });
  });
};


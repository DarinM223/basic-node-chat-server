/* @flow */
'use strict';
var bcrypt = require('bcrypt');
var async = require('async');

/**
 * returns an encrypted version of the password
 * @param {string} password 
 * @return {function(err, string)} callback
 */
exports.cryptPassword = function(password, callback) {
  bcrypt.genSalt(10, function (err, salt) {
    bcrypt.hash(password, salt, function(err, hash) {
      return callback(err, hash);
    });
  });
};

/**
 * compares a password to the encrypted password
 * @param {string} password the password to compare to hash
 * @param {string} userPassword the hashed password
 * @return {function(err, boolean)} callback
 */
exports.comparePassword = function(password, userPassword, callback) {
  bcrypt.compare(password, userPassword, function(err, isPasswordMatch) {
    if (err) {
      return callback(err);
    }
    return callback(null, isPasswordMatch);
  });
};

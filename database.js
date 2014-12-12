/* @flow */
'use strict';

var User = require('./models/User.js');
var redisSubClient = require('./redis/redis-subscription.js');

module.exports = {
  insertUser: function(username, password, callback) {
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
        return callback(err, null);
      }
      return callback(null, true);
    });
  },

  verifyUser: function(username, password, callback) {
    User.findOne({ 'username': username }, function(err, user) {
      // if the username does not exist, return false
      if (err || !user) {
        return callback(err, null);
      }
      user.comparePassword(password, function(err, isPasswordMatch) {
        return callback(err, user);
      });
    });
  },

  // quickly checks if the group already exists
  hasGroup: function(groupid) {
    redisSubClient.exists('group:' + groupid, function(err, result) {
      if (err) {
        console.log(err);
      } else if (result) { // group already in cache
        return true;
      } else { // group not in cache, check database
        Group.find({ _id: groupid }, function(err, result) {
          if (err) {
            console.log(err);
            return false;
          } else if (result) {
            return true;
          } else {
            return false;
          }
        });
      }
    });
  }
};

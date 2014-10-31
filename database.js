'use strict';

var User = require('./models/users.js');

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
        return callback(null, false);
      }
      user.comparePassword(password, function(err, isPasswordMatch) {
        return callback(err, isPasswordMatch);
      });
    });
  },
};

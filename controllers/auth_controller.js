'use strict';

var passport = require('passport')
  , User = require('../models/User.js')
  , BasicStrategy = require('passport-http').BasicStrategy;

passport.use(new BasicStrategy(
  function(username, password, callback) {
    User.findOne({ username: username }, function(err, user) {
      if (err) return callback(err);
      if (!user) return callback(null, false);

      user.comparePassword(password, function(err, isPasswordMatch) {
        if (err) return done(err);
        if (!isPasswordMatch) {
          return callback(null, false);
        }
        return callback(null, user);
      });
    });
  }
));

exports.isAuthenticated = passport.authenticate('basic', {session: false});

'use strict';

//Database setup
var mongo = require('mongodb');
var mongoose = require('mongoose');
var encryption = require('./encryption.js');

var UserSchema = mongoose.Schema({
  // enforce username uniqueness
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  created: { type: Date, default: Date.now }
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
 * @constructor
 * @param {string} connectionURL the url to connect the database to
 * @param {boolean} testing true if you are in testing mode
 */
var database = function(connectionURL, testing) {
  this.debugging = false;
  if (testing) {
    this.debugging = true;
  }
  var connection = mongoose.createConnection(connectionURL);
  this.User = connection.model('User', UserSchema);
};

/**
 * inserts user into database
 * returns false if there is already an existing user that has the same username
 * @param {string} username
 * @param {string} password
 * @param {database~truthCallback} callback
 * @return {database~truthCallback}
 */
database.prototype.insertUser = function(username, password, callback) {
  var newUser = new this.User({
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
};

/**
 * checks the username and password in the database
 * returns false if user does not exist or password for the user is incorrect
 * @param {string} username
 * @param {string} password
 * @param {database~truthCallback} callback
 * @return {database~truthCallback} 
 */
database.prototype.verifyUser = function(username, password, callback) {
  this.User.findOne({ 'username': username }, function(err, user) {
    // if the username does not exist, return false
    if (err || !user) {
      return callback(null, false);
    }
    user.comparePassword(password, function(err, isPasswordMatch) {
      return callback(err, isPasswordMatch);
    });
  });
};

/**
 * a callback that returns either true or false
 * @callback database~truthCallback
 * @param {object} err
 * @param {boolean} isTrue
 */

/**
 * Returns an array of Users for debugging purposes
 * @param {function(err, Array.<User>)} callback
 */
database.prototype.listUsers = function(callback) {
  this.User.find({}, function(err, docs) {
    callback(err, docs);
  });
};



/**
 * Deletes all users
 * BE VERY CAREFUL THIS WILL DESTROY ALL USER DATA
 * <<< ONLY FOR TESTING >>>
 * @private
 */
database.prototype.clearUsers = function() {
  if (this.debugging === true) {
    this.User.collection.remove({}, function(err, result) {
    });
  }
};

module.exports = database;

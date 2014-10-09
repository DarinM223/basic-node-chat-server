'use strict';

var mongoose = require('mongoose');

/**
 * @constructor
 * @param {string} connectionURL the url to connect the database to
 * @param {boolean} testing true if you are in testing mode
 */
function Database(connectionURL, testing) {
  this.debugging = false;
  if (testing) {
    this.debugging = true;
  }
  var connection = mongoose.connect(connectionURL);

  // initialize models
  this.User = require('./models/users.js')(connection, testing);
};

var database = null;

module.exports = function(connectionURL, testing) {
  if (database) {
    return database;
  } else {
    database = new Database(connectionURL, testing);
    return database;
  }
};

'use strict';

var User = require('../models/users.js');
var database = require('../database.js');

/**
 * @method POST
 * @param {string} body.username
 * @param {string} body.password
 */
exports.newUser = function(req, res) {
  if (req && req.body && req.body.username && req.body.password) {
    database.insertUser(req.body.username, req.body.password, function(err, success) {
      if (err) {
        console.log(err);
      } else if (success) {
          res.json({
            success: true,
            username: req.body.username
          });
      } else {
        res.json({
          success: false,
          error: 'There was an error creating new user '
        });
      }
    });
  } else {
    res.json({
      error: 'You have to include a username and password!'
    });
  }
};

/**
 * @method GET
 * @param {string} id 
 */
exports.getUser = function(req, res) {
  if (req.param('id')) {
    User.findOne({ '_id': req.param('id') }, function(err, user) {
      if (!err) {
        res.json({
          'success': true,
          'user': user
        });
      } else {
        res.json({
          'success': false
        });
      }
    });
  } else {
    res.json({
      error: 'You have to include an id to access a user!'
    });
  }
};

/**
 * @method PUT
 */
exports.updateUser = function(req, res) {
  res.json({
    message: 'Not implemented yet'
  });
}

/**
 * @method DELETE
 * @param {string} id
 */
exports.deleteUser = function(req, res) {
  if (req.param('id')) {
    if (req.user._id == req.param('id')) {
      // remove one user with that id
      User.remove({ '_id': req.param('id') }, true);

      res.json({
        success: true
      });
    } else {
      res.json({
        success: false, 
        error: 'You can only delete your own user account!'
      });
    }
  } else {
    res.json({
      success: false,
      error: 'You have to include an id to delete a user!'
    });
  }
};

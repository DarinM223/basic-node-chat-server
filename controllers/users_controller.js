'use strict';

var User = require('../models/User.js')
  , Group = require('../models/Group.js');

/**
 * @method POST
 * @param body.username
 * @param body.password
 */
exports.newUser = function(req, res) {
  if (req && req.body && req.body.username && req.body.password) {
    User.new(req.body.username, req.body.password, function(err, success) {
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
          error: 'There was an error creating a new user'
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
 * @param params.id
 */
exports.getUser = function(req, res) {
  if (req.param('id')) {
    User.findOne({ '_id': req.param('id') }, function(err, user) {
      if (!err && user) {
        res.json({
          success: true,
          user: user
        });
      } else {
        res.json({
          success: false
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
};

/**
 * @method POST
 * @param params.id userid
 * @param params.groupId
 */
exports.joinGroup = function(req, res) {
  var group = Group.findById(req.param('groupId'), function(err, group) {
    if (err || !group) {
      res.json({
        success: false,
        error: 'Group does not exist!'
      });
    } else {
      group.addUser(req.param('id'), function(err, result) {
        if (err || !result) {
          res.json({
            success: false,
            error: err+''
          });
        } else {
          res.json({
            success: true
          });
        }
      });
    }
  });
};

/**
 * @method DELETE
 * @param params.id
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

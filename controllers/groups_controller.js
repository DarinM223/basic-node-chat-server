'use strict';

var Group = require('../models/Group.js')
  , mongoose = require('mongoose');

/**
 * @method POST
 * @param body.name
 */
exports.newGroup = function(req, res) {
  if (!(req && req.body && req.body.name)) {
    res.json({
      success: false,
      error: 'You have specify a name for the group'
    });
  } else if (req.user && req.user._id) {
    var group = new Group({
      createdUser: mongoose.Types.ObjectId(req.user._id),
      name: req.body.name
    });
    group.save(function(err) {
      if (err) {
        console.log(err);
      } else {
        res.json({
          success: true,
          name: req.body.name
        });
      }
    });
  } else {
    res.json({
      success: false,
      error: 'You can only add a group to your own user account!'
    });
  }
};

/**
 * @method GET
 * @param {string} params.id
 */
exports.getGroup = function(req, res) {
  Group.findOne({ '_id': req.param('id') }, function(err, group) {
    if (!err && group) {
      res.json({
        success: true,
        group: group
      });
    } else {
      res.json({
        success: false
      });
    }
  });
};

/**
 * @method GET
 * @param {string} body.query query to search for
 */
exports.findGroup = function(req, res) {
  // TODO: implement this
  res.json({
    message: 'Not implemented yet'
  });
};

/**
 * @method PUT
 * @param {string} params.id
 */
exports.updateGroup = function(req, res) {
  // TODO: implement this
  res.json({ message: 'Not implemented yet' });
};

/**
 * @method DELETE
 * @param {string} params.id
 */
exports.deleteGroup = function(req, res) {
  var groupId = req.param('id');
  if (groupId === null) {
    res.json({
      success: false,
      error: 'GroupId is not a parameter'
    });
  } else {
    Group.findById(groupId, function(err, group) {
      if (err || !group) {
        res.json({
          success: false,
          error: 'Group does not exist'
        });
      } else {
        if (group.createdUser == req.user._id) {
          Group.remove({ '_id': groupId }, true);
          res.json({
            success: true
          });
        } else {
          res.json({
            success: false,
            error: 'You can only delete groups from your own user account!'
          });
        }
      }
    });
  }
};

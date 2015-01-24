'use strict';

var Group = require('../models/Group.js')
  , mongoose = require('mongoose');

/**
 * @method POST
 * @param params.id
 * @param params.groupId
 * @param body.name
 */
exports.newGroup = function(req, res) {
  if (!(req && req.body && req.body.name)) {
    res.json({
      success: false,
      error: 'You have specify a name for the group'
    });
  } else if (req.user && req.user._id == req.param('id')) {
    var group = new Group({
      createdUser: mongoose.Types.ObjectId(req.param('id')),
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
 * @param params.id
 */
exports.getGroups = function(req, res) {
  Group.find({ createdUser: req.param('id') }, function(err, docs) {
    if (!err && docs) {
      res.json({
        success: true,
        groups: docs
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
 * @param params.groupid
 */
exports.getGroup = function(req, res) {
  Group.findOne({ '_id': req.param('groupId') }, function(err, group) {
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
 * @method PUT
 * @param params.id
 * @param params.groupId
 */
exports.updateGroup = function(req, res) {
  res.json({ message: 'Not implemented yet' });
};

/**
 * @method DELETE
 * @param params.id
 * @param params.groupId
 */
exports.deleteGroup = function(req, res) {
  if (req.user._id == req.param('id')) {
    Group.remove({ '_id': req.param('groupId') }, true);
    res.json({
      success: true
    });
  } else {
    res.json({
      success: false,
      error: 'You can only delete groups from your own user account!'
    });
  }
};

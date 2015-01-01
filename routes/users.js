/* @flow */
'use strict';

/*
 * Route for /users
 */

var express = require('express');

var router = express.Router();

var usersController = require('../controllers/users_controller.js');
var groupController = require('../controllers/groups_controller.js');
var authController = require('../controllers/auth_controller.js');

router.post('/', usersController.newUser);
router.get('/:id', authController.isAuthenticated, usersController.getUser);
router.put('/:id', authController.isAuthenticated, usersController.updateUser);
router.delete('/:id', authController.isAuthenticated, usersController.deleteUser);

router.route('/:id/groups/')
  .post(authController.isAuthenticated, groupController.newGroup)
  .get(authController.isAuthenticated, groupController.getGroups);
router.route('/:id/groups/:groupId')
  .put(authController.isAuthenticated, groupController.updateGroup)
  .delete(authController.isAuthenticated, groupController.deleteGroup);

module.exports = router;

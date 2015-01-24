/* @flow */
'use strict';

/*
 * Route for /users
 */

var express = require('express')
  , router = express.Router()
  , usersController = require('../controllers/users_controller.js')
  , groupController = require('../controllers/groups_controller.js')
  , authController = require('../controllers/auth_controller.js');

router.post('/', usersController.newUser);
router.get('/:id', authController.isAuthenticated, usersController.getUser);
router.put('/:id', authController.isAuthenticated, usersController.updateUser);
router.post('/:id/:groupId', authController.isAuthenticated, usersController.joinGroup);
router.delete('/:id', authController.isAuthenticated, usersController.deleteUser);

router.route('/:id/groups/')
  .post(authController.isAuthenticated, groupController.newGroup)
  .get(authController.isAuthenticated, groupController.getGroups);
router.route('/:id/groups/:groupId')
  .put(authController.isAuthenticated, groupController.updateGroup)
  .delete(authController.isAuthenticated, groupController.deleteGroup);

module.exports = router;

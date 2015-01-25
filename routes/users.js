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
router.route('/:id')
      .get(usersController.getUser)
      .put(authController.isAuthenticated, usersController.updateUser)
      .delete(authController.isAuthenticated, usersController.deleteUser);
router.post('/:groupId/join', authController.isAuthenticated, usersController.joinGroup);
router.get('/:id/groups', usersController.getGroups);

exports = module.exports = router;

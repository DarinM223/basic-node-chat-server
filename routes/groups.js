'use strict';

var express = require('express')
  , router = express.Router()
  , groupsController = require('../controllers/groups_controller.js')
  , authController = require('../controllers/auth_controller.js');

router.post('/', groupsController.newGroup);
router.route('/:groupId')
      .get(groupsController.getGroup)
      .put(authController.isAuthenticated, groupsController.updateGroup)
      .delete(authController.isAuthenticated, groupsController.deleteGroup);
router.get('/find', groupsController.findGroup);

module.exports = router;

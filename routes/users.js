/* @flow */
'use strict';

/*
 * Route for /users
 */

var express = require('express');

var router = express.Router();
var usersController = require('../controllers/usersController.js');
var authController = require('../controllers/authController.js');

router.post('/new', usersController.newUser);
router.get('/:id', authController.isAuthenticated, usersController.getUser);
router.put('/:id', authController.isAuthenticated, usersController.updateUser);
router.delete('/:id', authController.isAuthenticated, usersController.deleteUser);

module.exports = router;

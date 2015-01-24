/* @flow */
'use strict';

/*
 * Route for /
 */

var flash = require('connect-flash')
  , express = require('express')
  , passport = require('passport')
  , router = express.Router();

router.get('/', function(req, res) {
  res.render('index');
});

module.exports = router;

/* @flow */
'use strict';

/*
 * Route for /
 */

var flash = require('connect-flash');
var express = require('express');
var passport = require('passport');

var router = express.Router();

router.get('/', function(req, res) {
  res.render('index');
});

module.exports = router;

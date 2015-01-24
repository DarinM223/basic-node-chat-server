'use strict';

var mongoose = require('mongoose');
if (mongoose.connection.readyState === 0) {
  mongoose.connect('mongodb://localhost:27017/test');
}

var should = require('should')
  , io = require('socket.io-client')
  , express = require('express')
  , async = require('async');

describe('Testing socket server', function() {
});

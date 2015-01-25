/* @flow */
'use strict';

var Server = require('./server.js')
  , mongoose = require('mongoose');

// connect to main database
mongoose.connect('mongodb://localhost:27017/mydb');

var server = Server(3000, function() {
  console.log('Server started at port 3000');
});

var socketServer = require('./socketServer.js')(server);

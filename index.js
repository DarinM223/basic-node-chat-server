/* @flow */
'use strict';

var Server = require('./server.js')
  , mongoose = require('mongoose');

var port = process.argv[2];
if (port === null) {
  console.log('You must specify a port');
} else {
  // connect to main database
  mongoose.connect('mongodb://localhost:27017/mydb');
  
  var server = Server(port, function() {
    console.log('Server started at port ' + port);
  });
  
  var socketServer = require('./socketServer.js')(server);
}

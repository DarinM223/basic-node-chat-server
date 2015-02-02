'use strict';

var express = require('express')
  , app = express()
  , async = require('async')
  , bodyParser = require('body-parser')
  , passport = require('passport')
  , SocketServer = require('./SocketServer.js');

var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(passport.initialize());

// set the views directory to the tpl directory that we made
app.set('views', __dirname + '/tpl');

// set the jade engine
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);

var users = require('./routes/users.js')
  , groups = require('./routes/groups.js')
  , index = require('./routes/index.js');

app.use('/users', users);
app.use('/groups', groups);
app.use('/', index);

// tell express to find where the public files needed for the html pages are
app.use(express.static(__dirname + '/public'));

module.exports = function(port, callback) {
  var server = app.listen(port, callback)
    , io = require('socket.io').listen(server)
    , socketServer = new SocketServer(io);

  io.sockets.on('connection', function(client) {
    client.on('user:login', socketServer.onUserLogin.bind(socketServer, client));
    client.on('message', socketServer.onMessage.bind(socketServer, client));
    client.on('disconnect', socketServer.onDisconnect.bind(socketServer, client));
  });
  return server;
};

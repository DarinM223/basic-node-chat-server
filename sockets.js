/* @flow */
'use strict';

var User = require('./models/User.js');
var database = require('./database.js');

var io = null;

// so you can find current username using the socket
var sockid_to_username = {};
var username_to_sockid = {};

function socketInit(socket) {
  socket.emit('message', { message: 'Hello, please login to chat' });
}

function onUserLogin(data) {
  var clientSocket = this;

  if (data.username in username_to_sockid) {
    clientSocket.emit('login:message', { error: 'You have already logged in' });
  } else {
    // verify user from username and password
    database.verifyUser(data.username, data.password, function(err, isMatch) {
      if (err) {
        console.log('There was an error with the database!');
        clientSocket.disconnect();
      } else if (isMatch) {
        clientSocket.join('registered');
        sockid_to_username[clientSocket.id] = data.username;
        username_to_sockid[data.username] = clientSocket.id;
        clientSocket.emit('login:message', { username: data.username });
        io.sockets.emit('user:login', { username: data.username });
      } else {
        clientSocket.emit('login:message', { error: 'Your username or password was incorrect' });
        clientSocket.disconnect();
      }
    });
  }
}

function onUserList() {
  var clientSocket = this;

  var username_list = [];
  for (var key in sockid_to_username) {
    if (sockid_to_username[key]) {
      username_list.push(sockid_to_username[key]);
    }
  }
  clientSocket.emit('user:list', { list: username_list });
}

function onJoinGroup(data) {
  var clientSocket = this;

  // if socket is logged in
  if (sockid_to_username[clientSocket.id] && sockid_to_username[clientSocket.id] === data.username) {
    clientSocket.join(data.groupId);
  } else {
    clientSocket.emit('message', { error: 'You are not logged in' });
  }
}

function onMessage(data) {
  var clientSocket = this;

  //if the socket is registered, send the message
  if (sockid_to_username[clientSocket.id] && sockid_to_username[clientSocket.id] === data.username) {
    if (!data.receiver) {
      // send a message to the specific group
      clientSocket.broadcast.to(data.groupId).emit('message', data);
    } else {
      // private message
      if (username_to_sockid[data.receiver]) {
        var receiverid = username_to_sockid[data.receiver];
        io.sockets.connected[receiverid].emit('message', data);
        clientSocket.emit('message', data);
      } else {
        clientSocket.emit('message', { error: 'User is either not online or does not exist' });
      }
    }
  } else {
    clientSocket.emit('message', { error: 'You are not logged in' });
    clientSocket.disconnect();
  }
}

function onDisconnect() {
  var clientSocket = this;

  // emit disconnected message
  if (sockid_to_username[clientSocket.id]) {
    var disconnected_uname = sockid_to_username[clientSocket.id];
    var username = sockid_to_username[clientSocket.id];
    delete sockid_to_username[clientSocket.id];
    delete username_to_sockid[username];

    // send disconnect to every room the socket was in
    for (var i = 0; i < clientSocket.rooms.length; i++) {
      clientSocket.broadcast.to(clientSocket.rooms[i]).emit('user:logout', { username: disconnected_uname });
    }
  }
}

module.exports = function(app, port) {
  var server = app.listen(port);
  io = require('socket.io').listen(server);

  io.sockets.on('connection', function(client) {
    socketInit(client);

    client.on('user:login', onUserLogin.bind(client));
    client.on('user:list', onUserList.bind(client));
    client.on('user:joingroup', onJoinGroup.bind(client));
    client.on('message', onMessage.bind(client));
    client.on('disconnect', onDisconnect.bind(client));
  });
  return {
    'resetEverything': function() {
      User.collection.remove({}, function(err, result) {});
      sockid_to_username = {};
      username_to_sockid = {};
    }
  };
};

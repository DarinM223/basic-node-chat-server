var database = null;

// so you can find current username using the socket
var sockid_to_username = {};
var username_to_sockid = {};

function socketInit(socket) {
  socket.emit('message', { message: 'Hello, please login to chat' });
}

function onUserLogin(data) {
  var clientSocket = this;

  var already_registered = false;
  for (var key in sockid_to_username) {
    // if the username that you want is already in a socket
    if (sockid_to_username[key] === data.username) {
      already_registered = true;
    }
  }
  if (already_registered) {
    clientSocket.emit('login:message', { error: 'You have already logged in' });
  } else {
    // verify user from username and password
    database.User.verify(data.username, data.password, function(err, isMatch) {
      if (err) {
        console.log('There was an error with the database!');
      } else if (isMatch) {
        clientSocket.join('registered');
        sockid_to_username[clientSocket.id] = data.username;
        username_to_sockid[data.username] = clientSocket.id;
        clientSocket.emit('login:message', { username: data.username });
        io.sockets.emit('user:login', { username: data.username });
      } else {
        clientSocket.emit('login:message', { error: 'Your username or password was incorrect' });
      }
    });
  }
}

function onUserSignup(data) {
  var clientSocket = this;

  var userName = data.username;
  var userPwd = data.password;

  if (!userName || !userPwd) {
    clientSocket.emit('signup:message', { error: "Username or password is empty" });
  } else if (userName.trim() === "" || userPwd.trim() === "") {
    clientSocket.emit('signup:message', { error: "Username or password is empty" });
  } else {
    // insert new user
    database.User.insert(userName, userPwd, function(err, result) {
      if (err) {
        console.log(err);
        console.log('There was an error accessing the database!');
      } else if (result === true) {
        clientSocket.emit('signup:message', { username: userName });
      } else {
        clientSocket.emit('signup:message', { error: 'There is already an account with this username' });
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

function onMessage(data) {
  var clientSocket = this;

  //if the socket is registered, send the message
  if (sockid_to_username[clientSocket.id] && sockid_to_username[clientSocket.id] === data.username) {
    if (!data.receiver) {
      // public message
      io.sockets.emit('message', data);
    } else {
      // private message
      if (username_to_sockid[data.receiver]) {
        receiverid = username_to_sockid[data.receiver];
        clientSocket.to(receiverid).emit('message', data);
        clientSocket.emit('message', data);
      } else {
        clientSocket.emit('message', { error: 'User is either not online or does not exist' });
      }
    }
  } else {
    clientSocket.emit('message', { error: 'You have to login before chatting' });
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

    io.sockets.emit('user:logout', { username: disconnected_uname });
  }
}

module.exports = function(app, port, debugging) {
  var server = app.listen(port);
  io = require('socket.io').listen(server);
  if (debugging) {
    database = require('./database.js')('mongodb://localhost:27017/test', true);
  } else {
    database = require('./database.js')('mongodb://localhost:27017/mydb', false);
  }

  io.sockets.on('connection', function(client) {
    socketInit(client);

    client.on('user:login', onUserLogin);
    client.on('user:signup', onUserSignup);
    client.on('user:list', onUserList);
    client.on('message', onMessage);
    client.on('disconnect', onDisconnect);
  });
  return {
    'resetEverything': function() {
      database.User.clear();
      sockid_to_username = {};
    }
  };
};

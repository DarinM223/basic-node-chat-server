'use strict';
var express = require('express');
var app = express();
var async = require('async');

//you need this to parse requests!!!!!
//app.use(express.json()); //this doesn't work!!!
//app.use(express.urlencoded()); //this doesn't work either!!!

// have to manually include body parser
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded());

// set the views directory to the tpl directory that we made
app.set('views', __dirname + '/tpl');

// set the jade engine
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);

// set up server that renders the page when a request is made
app.get("/", function (req, res) {
  res.render("index");
});

// tell express to find where the public files needed for the html pages are
app.use(express.static(__dirname + '/public'));

// use socket integration
var port = 3700;

var sockets = require('./sockets.js')(app, port, false);

//var io = require('socket.io').listen(app.listen(port));

//console.log("Listening on port " + port);

//// socket passed in function (socket) is the client's socket
//io.sockets.on('connection', function (socket) {
//  socket.emit('message', { message: 'Hello, please login to chat' });

//  for (var i = 0; i < messages.pastMessages.length; i++) {
//    socket.emit('message', messages.pastMessages[i]);
//  }
//  // if it receives a login request, check database for existing users
//  socket.on('user:login', function (data) {
//    var already_registered = false;
//    for (var key in sockid_to_username) {
//      // if the username that you want is already in a socket
//      if (sockid_to_username[key] === data.username) {
//        already_registered = true;
//      }
//    }
//    if (already_registered) {
//      socket.emit('login:message', { error: 'You have already logged in' });
//    } else {
//      // verify user from username and password
//      database.verifyUser(data.username, data.password, function(err, isMatch) {
//        if (err) {
//          console.log('There was an error with the database!');
//        } else if (isMatch) {
//          socket.join('registered');
//          sockid_to_username[socket.id] = data.username;
//          socket.emit('login:message', { username: data.username });
//          io.sockets.emit('user:login', { username: data.username });
//        } else {
//          socket.emit('login:message', { error: 'Your username or password was incorrect' });
//        }
//      });
//    }
//  });

//  socket.on('user:signup', function (data) {
//    var userName = data.username;
//    var userPwd = data.password;

//    if (!userName || !userPwd) {
//      socket.emit('signup:message', { error: "Username or password is empty" });
//    } else if (userName.trim() === "" || userPwd.trim() === "") {
//      socket.emit('signup:message', { error: "Username or password is empty" });
//    } else {
//      // insert new user
//      database.insertUser(userName, userPwd, function(err, result) {
//        if (err) {
//          console.log(err);
//          console.log('There was an error accessing the database!');
//        } else if (result === true) {
//          socket.emit('signup:message', { username: userName });
//        } else {
//          socket.emit('signup:message', { error: 'There is already an account with this username' });
//        }
//      });
//    }
//  });

//  // send list of users when requested
//  socket.on('user:list', function () {
//    var username_list = [];
//    for (var key in sockid_to_username) {
//      if (sockid_to_username[key]) {
//        username_list.push(sockid_to_username[key]);
//      }
//    }
//    socket.emit('user:list', { list: username_list });
//  });
  
//  // when client sends data, emit data to other clients
//  socket.on('message', function (data) {
//    //if the socket is registered, send the message
//    if (sockid_to_username[socket.id] && sockid_to_username[socket.id] === data.username) {
//      if (!data.receiver) {
//        // public message
//        io.sockets.emit('message', data);
//        messages.add_message(data);
//      } else {
//        // private message
//        var sent_message = false;
//        for (var key in sockid_to_username) {
//          // if socket id's mapped username matches the client to receive the message
//          if (sockid_to_username[key] === data.receiver) {
//            // send to that socket and your socket
//            socket.to(key).emit('message', data);
//            socket.emit('message', data);
//            sent_message = true;
//          }
//        }
//        if (!sent_message) {
//          socket.emit('message', { error: 'User is either not online or does not exist' });
//        }
//      }
//    } else {
//      socket.emit('message', { error: 'You have to login before chatting' });
//    }
//  });

//  socket.on('disconnect', function () {
//    // emit disconnected message
//    if (sockid_to_username[socket.id]) {
//      var disconnected_uname = sockid_to_username[socket.id];
//      sockid_to_username[socket.id] = null;
//      io.sockets.emit('user:logout', { username: disconnected_uname });
//    }
//  });
//}); // io.sockets.on('connection', function (socket) {

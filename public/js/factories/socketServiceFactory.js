/* @flow */
'use strict'; 

var chatApp = angular.module('chatApp');

chatApp.factory('socketService', function($rootScope, socket, 
    chatListFactory, messageListFactory, userListFactory) {
  var chatList = chatListFactory;
  var messageList = messageListFactory.list;
  var userList = userListFactory.list;
  var hiddenUsers = userListFactory.hiddenUsers;

  // edit for groups: from the message tell which group it is, then add it to the specific group and send a notification
  socket.on('message', function(data) {
    if (!data.error) {
      // chatList.unshift(data);
      chatList.push(data);
    } else {
      messageListFactory.addAndFade(data);
    }
  });

  socket.on('user:login', function(data) {
    var message = {
      message: data.username + ' has connected to the server'
    };
    chatList.unshift(message);
    var notInUserList = true;

    for (var i = 0; i < userList.length; i++) {
      if (userList[i] === data.username) {
        notInUserList = false;
      }
    }
    // add user to list if not already there
    if (notInUserList && data.username !== $rootScope.my_username) {
      userList.push(data.username);
    }
  });

  socket.on('user:logout', function(data) {
    var message = {
      message: data.username + ' has disconnected to the server'
    };
    chatList.unshift(message);

    // remove user from list
    for (var i = 0; i < userList.length; i++) {
      if (userList[i] === data.username) {
        userList.splice(i, 1);
      }
    }
    hiddenUsers[data.username] = null;
  });

  socket.on('user:list', function(data) {
    // clear user list
    while (userList.length > 0) {
      userList.pop();
    }
    // push usernames into list
    for (var index = 0; index < data.list.length; index++) {
      userList.push(data.list[index]);
    }
  });
  return {};
});


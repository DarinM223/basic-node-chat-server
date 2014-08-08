var chatApp = angular.module('chatApp');

chatApp.factory('messageListFactory', function($rootScope) {
  var messageList = [];
  return messageList;
});

chatApp.factory('userListFactory', function($rootScope) {
  var userList = {
    'list': [],
    'hiddenUsers': {}
  }; 
  return userList;
});

chatApp.factory('socketService', function($rootScope, socket, 
    messageListFactory, userListFactory) {
  var messageList = messageListFactory;
  var userList = userListFactory.list;
  var hiddenUsers = userListFactory.hiddenUsers;

  socket.on('message', function(data) {
    console.log(data);
    messageList.unshift(data);
  });

  socket.on('userlogin', function(data) {
    var message = {
      message: data.username + ' has connected to the server'
    };
    messageList.unshift(message);
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

  socket.on('userlogout', function(data) {
    var message = {
      message: data.username + ' has disconnected to the server'
    };
    messageList.unshift(message);

    // remove user from list
    for (var i = 0; i < userList.length; i++) {
      if (userList[i] === data.username) {
        userList.splice(i, 1);
      }
    }
    hiddenUsers[data.username] = null;
  });

  socket.on('list', function(data) {
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

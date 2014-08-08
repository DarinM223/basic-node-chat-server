'use strict';

var chatApp = angular.module('chatApp');
var connectionURL = 'http://localhost:3700';

// creates a ng-enter directive that fires when the
// enter key is pressed
chatApp.directive('ngEnter', function() {
  return function (scope, element, attrs) {
    element.bind('keydown keypress', function (event) {
      if (event.which === 13) {
        scope.$apply(function () {
          scope.$eval(attrs.ngEnter);
        });

        event.preventDefault();
      }
    });
  };
});

chatApp.factory('messageListFactory', function($rootScope) {
  var messageList = [];
  return messageList;
});

chatApp.factory('userListFactory', function($rootScope) {
  var userList = []; 
  return userList;
});

// main controller for the application, controls the
// message and user lists and the current logged in user
chatApp.controller('listControl', function ($scope, socket) {
  $scope.messageList = [];
  $scope.userList = [];
  $scope.hiddenUsers = {};
  $scope.selectedIndex = -1;
  $scope.my_username = null;
  $scope.loginWarning = '';
  $scope.signupWarning = '';
  $scope.dropdownText = 'Message text';

  // grab current list of users at the start
  socket.emit('list');

  socket.on('message', function(data) {
    console.log(data);
    $scope.messageList.unshift(data);
  });

  socket.on('userlogin', function(data) {
    var message = {
      message: data.username + ' has connected to the server'
    };
    $scope.messageList.unshift(message);
    var notInUserList = true;

    for (var i = 0; i < $scope.userList.length; i++) {
      if ($scope.userList[i] === data.username) {
        notInUserList = false;
      }
    }
    // add user to list if not already there
    if (notInUserList && data.username !== $scope.my_username) {
      $scope.userList.push(data.username);
    }
  });

  socket.on('userlogout', function(data) {
    var message = {
      message: data.username + ' has disconnected to the server'
    };
    $scope.messageList.unshift(message);

    // remove user from list
    for (var i = 0; i < $scope.userList.length; i++) {
      if ($scope.userList[i] === data.username) {
        $scope.userList.splice(i, 1);
      }
    }
    $scope.hiddenUsers[data.username] = null;
  });

  socket.on('list', function(data) {
    // clear user list
    while ($scope.userList.length > 0) {
      $scope.userList.pop();
    }
    // push usernames into list
    for (var index = 0; index < data.list.length; index++) {
      $scope.userList.push(data.list[index]);
    }
  });

  socket.on('login-response', function(data) {
    // if login successful, change current username, otherwise push error message
    if (data.username) {
      $scope.my_username = data.username;
      $('#modalLogin').modal('hide');
    } else {
      //$scope.messageList.unshift(data);
      $scope.loginWarning = data.error;
    }
  });

  socket.on('signup-response', function(data) {
    if (!data.error) {
      loginUser(data.username, data.password);
      $('#modalSignup').modal('hide');
    } else {
      $scope.signupWarning = data.error;
    }
  });

  $scope.matchMessage = function(query) {
    return function(message) {
      if ($scope.dropdownText === 'Message text') {
        if (message.message) {
          return message.message.match(query);
        } else {
          return message.error.match(query);
        }
      } else {
        if (message.username) {
          return message.username.match(query);
        } else {
          return 'Server'.match(query);
        }
      }
    };
  };

  /**
   * @param {string} chatMessage
   * @param {string} username
   * @param {string} receiver
   * @param {function} callback
   */
  function sendMessage(chatMessage, username, receiver, callback) {
    var newMessage = {
      'username': username,
      'message': chatMessage,
    };
    if (receiver) {
      newMessage.receiver = receiver;
    }
    socket.emit('send', newMessage, callback);
  }

  /**
   * @param {string} username
   * @param {string} password
   * @param {function} callback
   */
  function loginUser(username, password, callback) {
    socket.emit('login', {'username': username, 'password': password}, callback);
  }

  /**
   * @param {string} username
   * @param {string} password
   * @param {function} callback
   */
  function signupUser(username, password, callback) {
    socket.emit('signup', { 'username': username, 'password': password }, callback);
  }

  /**
   * @param {string} chatMessage
   */
  $scope.onSend = function(chatMessage) {
    if ($scope.selectedIndex !== -1) {
      sendMessage(chatMessage, $scope.my_username, $scope.userList[$scope.selectedIndex]);
    } else {
      sendMessage(chatMessage, $scope.my_username, null);
    }

    $scope.clearFields();
  };

  /**
   * @param {string} username
   * @param {string} password
   */
  $scope.onLogin = function(username, password) {
    if (!username || username === '') {
      $scope.loginWarning = 'Username is empty';
    } else if (!password || password === '') {
      $scope.loginWarning = 'Password is empty';
    } else {
      loginUser(username, password);
    }
    $scope.clearFields();
  };

  $scope.onLogout = function() {
    $scope.my_username = null;
    socket.restart();
  };

  /**
   * @param {string} username
   * @param {string} password
   * @param {string} passwordReenter
   */
  $scope.onSignup = function(username, password, passwordReenter) {
    if (!username || username === '') {
      $scope.signupWarning = 'Username is empty';
    } else if (password === passwordReenter) {
      signupUser(username, password);
    } else {
      $scope.signupWarning = 'Passwords are not the same';
    }
    $scope.clearFields();
  };

  $scope.clearFields = function() {
    $scope.chatInput = '';
    $scope.loginUsername = '';
    $scope.loginPassword = '';
    $scope.signupUsername = '';
    $scope.signupPassword = '';
    $scope.signupPasswordReenter = '';
  };

  /**
   * @param {message} message
   * @return {string}
   */
  $scope.messageColorSelect = function(message) {
    if (message.error) {
      return 'alert-danger';
    } else if (message.receiver) {
      return 'alert-info';
    } else if (message.username) {
      return 'alert-success';
    } else {
      return 'alert-warning';
    }
  };

  /**
   * @param {string} username
   * @return {boolean}
   */
  $scope.isUserHidden = function(username) {
    if ($scope.hiddenUsers[username]) {
      return true;
    } else {
      return false;
    }
  };

  /**
   * @param {string} name
   * @return {string}
   */
  $scope.labelColorSelect = function(name) {
    if (name === $scope.my_username) {
      return 'label-success';
    } else if (name) {
      return 'label-primary';
    } else {
      return 'label-default';
    }
  };

  /**
   * @param {string} name
   * @return {string}
   */
  $scope.labelNameSelect = function(name) {
    if (name === $scope.my_username) {
      return 'You';
    } else if (name) {
      return name;
    } else {
      return 'Server';
    }
  };

  /**
   * @param {number} index
   */
  $scope.removeMessage = function(index) {
    $scope.messageList.splice(index, 1);
  };

  /**
   * @param {number} index
   */
  $scope.userClicked = function(index) {
    if ($scope.selectedIndex === index) {
      $scope.selectedIndex = -1;
    } else {
      $scope.selectedIndex = index;
    }
  };
});

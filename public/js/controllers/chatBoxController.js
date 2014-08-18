'use strict';

var chatApp = angular.module('chatApp');

// main controller for the application, controls the
// message and user lists and the current logged in user
chatApp.controller('chatBoxControl', function($scope, $rootScope, socket, 
    messageListFactory, chatListFactory, userListFactory) {
  $scope.chatList = chatListFactory;

  // grab current list of users at the start
  socket.emit('list');

  $scope.matchChatMessage = function(query) {
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
   * @param {message} message
   * @return {string}
   */
  $scope.chatMessageColorSelect = function(message) {
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
   * @param {string} name
   * @return {string}
   */
  $scope.labelColorSelect = function(name) {
    if (name === $rootScope.my_username) {
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
    if ($rootScope && $rootScope.my_username && name === $rootScope.my_username) {
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
  $scope.removeChatMessage = function(index) {
    $scope.chatList.splice(index, 1);
  };
});

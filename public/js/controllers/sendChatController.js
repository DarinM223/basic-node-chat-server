/* @flow */
'use strict';

var chatApp = angular.module('chatApp');

chatApp.controller('sendChatControl', function($scope, $rootScope, socket, userListFactory) {
  $scope.userList = userListFactory.list;
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
    socket.emit('message', newMessage);
  }

  /**
   * @param {string} chatMessage
   */
  $scope.onSend = function(chatMessage) {
    if ($rootScope.selectedIndex !== -1) {
      sendMessage(chatMessage, $rootScope.my_username, $scope.userList[$rootScope.selectedIndex], null);
    } else {
      sendMessage(chatMessage, $rootScope.my_username, null, null);
    }
    $scope.chatInput = '';
  };
});

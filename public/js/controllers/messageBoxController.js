'use strict';

var chatApp = angular.module('chatApp');

chatApp.controller('messageBoxControl', function($scope, $rootScope, socket, messageListFactory) {
  $scope.messageList = messageListFactory;
  $scope.removeMessage = function($index) {
    $scope.messageList.splice($index, 1);
  };
  $scope.messageColorSelect = function(message) {
    if (message.error) {
      return 'alert-danger';
    } else {
      return 'alert-success';
    }
  };
});

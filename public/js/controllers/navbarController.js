'use strict';

var chatApp = angular.module('chatApp');

chatApp.controller('navbarController', function($scope, $rootScope, socket, socketService) {
  $scope.dropdownText = 'Message text';
  $scope.onLogout = function() {
    $rootScope.my_username = null;
    socket.restart();
  };
});

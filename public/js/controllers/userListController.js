/* @flow */
'use strict';

var chatApp = angular.module('chatApp');

chatApp.controller('userListControl', function($scope, $rootScope, userListFactory) {
  $scope.userList = userListFactory.list;
  $scope.hiddenUsers = userListFactory.hiddenUsers;
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
   * @param {number} index
   */
  $scope.userClicked = function(index) {
    if ($rootScope.selectedIndex === index) {
      $rootScope.selectedIndex = -1;
    } else {
      $rootScope.selectedIndex = index;
    }
  };
});

chatApp.controller('navbarController', function($scope, $rootScope, socket, socketService) {
  $scope.dropdownText = 'Message text';
  $scope.onLogout = function() {
    $rootScope.my_username = null;
    socket.restart();
  };
});

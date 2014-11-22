/* @flow */
'use strict';
var chatApp = angular.module('chatApp');

chatApp.controller('loginControl', function($scope, $rootScope, socket, userListFactory, messageListFactory) {
  $scope.loginWarning = '';
  $scope.signupWarning = '';
  $scope.messageList = messageListFactory.list;

  /**
   * @param {string} username
   * @param {string} password
   * @param {function} callback
   */
  function signupUser(username, password, callback) {
    $http.post('/users/new', { username: username, password: password })
    .success(function(data, status, headers, config) {
      if (data.success) {
        $('#modalSignup').modal('hide');
        $scope.messageList.push({ message: 'You have successfully signed up as ' + data.username + '!' });
      } else {
        $scope.signupWarning = data.error;
      }
    }).error(function(data, status, headers, config) {
      $scope.signupWarning = "Error logging in!";
    });
  }

  $scope.clearFields = function() {
    $scope.loginUsername = '';
    $scope.loginPassword = '';
    $scope.signupUsername = '';
    $scope.signupPassword = '';
    $scope.signupPasswordReenter = '';
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

  /**
   * @param {string} username
   * @param {string} password
   * @param {string} passwordReenter
   */
  $scope.onSignup = function(username, password, passwordReenter) {
    if (!username || username === '') {
      $scope.signupWarning = 'Username is empty';
    } else if (password === passwordReenter) {
      signupUser(username, password, null);
    } else {
      $scope.signupWarning = 'Passwords are not the same';
    }
    $scope.clearFields();
  };
});

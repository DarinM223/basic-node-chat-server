var chatApp = angular.module('chatApp');

chatApp.controller('loginControl', function($scope, $rootScope, socket, userListFactory, messageListFactory) {
  $scope.loginWarning = '';
  $scope.signupWarning = '';
  $scope.messageList = messageListFactory;
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

  socket.on('login-response', function(data) {
    // if login successful, change current username, otherwise push error message
    if (data.username) {
      $rootScope.my_username = data.username;
      $('#modalLogin').modal('hide');
    } else {
      //$scope.messageList.unshift(data);
      $scope.loginWarning = data.error;
    }
  });

  socket.on('signup-response', function(data) {
    if (!data.error) {
      $('#modalSignup').modal('hide');
      $scope.messageList.push({ message: 'You have successfully signed up as ' + data.username + '!' });
    } else {
      $scope.signupWarning = data.error;
    }
  });

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
      signupUser(username, password);
    } else {
      $scope.signupWarning = 'Passwords are not the same';
    }
    $scope.clearFields();
  };
});

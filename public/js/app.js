/* @flow */
'use strict';

var chatApp = angular.module('chatApp', [
  'ngRoute',
]);

/**
 * creates a ng-enter directive that fires when the
 * enter key is pressed
 */
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

chatApp.config(function($routeProvider) {
  $routeProvider
  .when('/', {
    templateUrl: '../views/main.html',
    controller: 'MainCtrl'
  })
  .when('/home', {
    templateUrl: '../views/main.html',
    controller: 'MainCtrl'
  })
  .when('/login', {
    templateUrl: '../views/login.html',
    controller: 'LoginCtrl'
  })
  .when('/signup', {
    templateUrl: '../views/signup.html',
    controller: 'SignupCtrl'
  });
});

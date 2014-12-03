'use strict';

var chatApp = angular.module('chatApp');

chatApp.controller('GroupCtrl', function($scope, $rootScope, $routeParams, socket, groupListFactory) {
  var groupFactory = groupListFactory;
  var groupId = $routeParams.groupId;
  /**
   * TODO: add code to add a group so that you can view notifications in the group
   */
});

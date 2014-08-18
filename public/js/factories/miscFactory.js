var chatApp = angular.module('chatApp');

chatApp.factory('messageListFactory', function($rootScope) {
  var messageList = [];
  return messageList;
});

chatApp.factory('chatListFactory', function($rootScope) {
  var chatList = [];
  return chatList;
});

chatApp.factory('userListFactory', function($rootScope) {
  var list = [];
  var hiddenUsers = {};
  var selectedIndex = -1;
  return {
    'list': list,
    'hiddenUsers': hiddenUsers,
  };
});

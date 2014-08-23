var chatApp = angular.module('chatApp');

/**
 * @return {Object<Array<string>, function(string)}
 */
chatApp.factory('messageListFactory', function($rootScope, $timeout) {
  var messageList = [];
  return {
    'list': messageList,
    'addAndFade': function(message) {
      messageList.push(message);
      // remove message after two seconds
      $timeout(function() {
        messageList.pop();
      }, 2000);
    }
  };
});

/**
 * @return {Array<string>}
 */
chatApp.factory('chatListFactory', function($rootScope) {
  var chatList = [];
  return chatList;
});

/**
 * @return {Object<Array<string>, Array<string>>}
 */
chatApp.factory('userListFactory', function($rootScope) {
  var list = [];
  var hiddenUsers = {};
  var selectedIndex = -1;
  return {
    'list': list,
    'hiddenUsers': hiddenUsers,
  };
});

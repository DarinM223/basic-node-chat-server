var connectionURL = 'http://localhost:3700';
// creates a socket that wraps the functions of socket.io
angular.module('chatApp').factory('socket', function ($rootScope) {
  var socket = io.connect(connectionURL);

  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      });
    }, 
    restart: function() {
      socket.io.disconnect();
      socket.io.reconnect();
    }
  };
});

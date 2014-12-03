/* @flow */
'use strict';

var User = require('./models/User.js');
var database = require('./database.js');
var socketManager = require('./socketManager.js');
var Group = require('./models/Group.js');

var redisSubClient = require('./redis/redis-subscription.js');
var redisPubClient = require('./redis/redis-publication.js');

var io = null;

function onUserLogin(data, callback) {
  var clientSocket = this;

    // verify user from username and password
  database.verifyUser(data.username, data.password, function(err, user) {
    if (err) {
      clientSocket.disconnect();
      return callback(err, null);
    } else if (user) {
      // check if user is already logged in through redis
      redisSubClient.get('login:' + user._id, function(err, value) {
        if (err) { 
          clientSocket.disconnect();
          return callback(err, null);
        } else if (value != null) { // already logged in 
          return callback(new Error('You have already logged in'), null);
        } else { // not logged in
          clientSocket.join('registered');

          socketManager.addPairing(clientSocket.id, user._id);
          redisSubClient.subscribe('message:' + user._id);
          redisSubClient.set('login:' + user._id, true, function(err) {
            if (err) {
              clientSocket.disconnect();
              return callback(err, null);
            }
          });

          return callback(null, { username: data.username });
        }
      });
    } else {
      clientSocket.disconnect();
      return callback(new Error('Your username or password was incorrect'), null);
    }
  });
}

function onJoinGroup(data, callback) {
  var clientSocket = this;

  var userid = socketManager.getUserId(clientSocket.id);

  redisSubClient.get('login:' + userid, function(err, value) {
    if (err) {
      return callback(err, null);
    } else if (value != null) { // if logged in
      if (database.hasGroup(data.groupId) { // check if group exists
        /*
         * TODO: add userid to mongodb's group set and add to redis only if it succeeds
         */
        //Group.update({ _id: data.groupId }, { 
        //  $push: {
        //    users: userid
        //  } 
        //}, function(err, result) {
        //  if (err) {
        //  }
        //}); // not sure if correct
        redisSubClient.sadd('group:' + data.groupId, userid, function(err, result) { // add userid to group
          if (err) {
            return callback(err, null);
          } else {
            if (result == 1) { 
              return callback(null, true);
            } else { // user already in group
              return callback(new Error('You are already in this group'), null);
            }
          }
        }); 
      } else {
        return callback(new Error('Group does not exist'), null);
      }
    } else {
      return callback(new Error('You are not logged in'), null);
    }
  });
}

function onMessage(data, callback) {
  var clientSocket = this;

  var userid = socketManager.getUserId(clientSocket.id);
  redis.get('login:' + userid, function(err, value) {
    if (err) {
      return callback(err, null);
    } else if (value != null) { // logged in
      if (data.receiverId) { // if data is an individual message
        redisPubClient.addIndividualMessage(data);
      } else if (data.groupId) { // if data is a group message
        redisPubClient.addGroupMessage(data);
      } else { // not valid message
        return callback(new Error('Message is not valid'), null);
      }
    } else { // not logged in
      return callback(new Error('You are not logged in'), null);
    }
  });
}

function onDisconnect() {
  var clientSocket = this;

  // emit disconnected message
  if (socketManager.hasSocketId(clientSocket.id)) {
    var disconnected_uid = socketManager.getUserId(clientSocket.id);
    socketManager.removePairing(clientSocket.id);

    // unsubscribe from that user's messages
    redisSubClient.unsubscribe('message:' + disconnected_uid);
  }
}

module.exports = function(app, port) {
  var server = app.listen(port);
  io = require('socket.io').listen(server);

  io.sockets.on('connection', function(client) {
    client.on('user:login', onUserLogin.bind(client));
    client.on('user:joingroup', onJoinGroup.bind(client));
    client.on('message', onMessage.bind(client));
    client.on('disconnect', onDisconnect.bind(client));
  });
  return {
    'resetEverything': function() {
      User.collection.remove({}, function(err, result) {});
      socketManager.reset();
    }
  };
};

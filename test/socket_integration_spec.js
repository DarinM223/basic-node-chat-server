'use strict';

var mongoose = require('mongoose');
if (mongoose.connection.readyState === 0) {
  mongoose.connect('mongodb://localhost:27017/test');
}

var options = {
    transports: ['websocket'],
    'force new connection': true
};

var should = require('should')
  , io = require('socket.io-client')
  , express = require('express')
  , app = express()
  , async = require('async')
  , Server = require('../server.js')
  , socketServer = require('../socketServer.js');

describe('Testing socket server', function() {
  before(function(done) {
    // create two users and a group and add the two users to the group
    done();
  });
  describe('Testing one server and two clients', function() {
    before(function(done) {
      // create server
      var server = Server(3000);
      var sockets = socketServer(server);
      // create socket.io clients
      var client1 = io.connect('http://localhost:3000', options);
      var client2 = io.connect('http://localhost:3000', options);
      // create new group and add the two clients to it
      done();
    });

    it('should return the logged in username on user:login event', function(done) {
      done();
    });

    it('should properly send message from one socket.io client to the other', function(done) {
      done();
    });

    it('should not receive messages from a user if the user disconnects', function(done) {
      done();
    });

    it('should send message to both users if a user sends a group message', function(done) {
      done();
    });
  });

  describe('Testing two servers and two clients on different servers', function() {
    before(function(done) {
      // create two servers
      // create socket.io clients
      // create new group and add the two clients to it
      done();
    });

    it('should properly send message from socket.io client to the other', function(done) {
      done();
    });

    it('should send message to both users if a user sends a group message', function(done) {
      done();
    });
  });
});

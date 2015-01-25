'use strict';

var mongoose = require('mongoose');
if (mongoose.connection.readyState === 0) {
  mongoose.connect('mongodb://localhost:27017/test');
}

var options = {
    transports: ['websocket'],
    'force new connection': true
};

var redisClient = require('../redis/redisClient.js')(false); // test client

var should = require('should')
  , io = require('socket.io-client')
  , express = require('express')
  , app = express()
  , async = require('async')
  , request = require('superagent')
  , Server = require('../server.js')
  , User = require('../models/User.js')
  , Group = require('../models/Group.js')
  , socketServer = require('../socketServer.js');

describe('Testing socket server', function() {
  var user1 = null
    , user2 = null
    , group1 = null;
  before(function(done) {
    // create two users and a group and add the two users to the group
    async.parallel([
      function createUser1(callback) {
        User.new('testuser1', 'hello', callback);
      }, 
      function createUser2(callback) {
        User.new('testuser2', 'hello', callback);
      },
    ], function(err) {
      async.parallel([
        function getUser1(callback) {
          User.findOne({ username: 'testuser1' }, callback);
        },
        function getUser2(callback) {
          User.findOne({ username: 'testuser2' }, callback);
        }
      ], function(err, results) {
        user1 = results[0];
        user2 = results[1];
        var group = new Group({
          createdUser: mongoose.Types.ObjectId(user1._id),
          name: 'New group',
          users: [mongoose.Types.ObjectId(user2._id)]
        });
        group.save(function(err, doc) {
          group1 = doc;
          done();
        });
      });
    });
  });

  describe('Testing one server and two clients', function() {
    var server = null
      , sockets = null
      , client1 = null
      , client2 = null;

    before(function(done) {
      // create server
      server = Server(3000);
      sockets = socketServer(server);
      // create socket.io clients
      client1 = io.connect('http://localhost:3000', options);
      client2 = io.connect('http://localhost:3000', options);

      async.parallel([
        function loginUser1(callback) {
          client1.emit('user:login', {
            username: 'testuser1',
            password: 'hello'
          }, function(err, username) {
            username.should.equal('testuser1');
            return callback(err, username);
          });
        },
        function loginUser2(callback) {
          client2.emit('user:login', {
            username: 'testuser2',
            password: 'hello'
          }, function(err, username) {
            username.should.equal('testuser2');
            return callback(err, username);
          });
        }
      ], function(err) {
        if (err) console.log(err);
        done();
      });
    });

    after(function(done) {
      server.close();
      client1.disconnect();
      client2.disconnect();
      redisClient.flushdb();
      User.remove({});
      Group.remove({});
      done();
    });

    it('should properly send message from one socket.io client to the other', function(done) {
      client2.on('message', function(data) {
        data.message.message.should.equal('Hello world!');
        done();
      });
      client1.emit('message', {
        senderId: user1._id,
        receiverId: user2._id,
        message: 'Hello world!'
      }, function(err, result) {
        if (err) console.log(err);
      });
    });

    it('should send message to both users if a user sends a group message', function(done) {
      var one = false, two = false;
      client2.on('message', function(data) {
        data.message.message.should.equal('Hello world!');
      });
      client1.on('message', function(data) {
        data.message.message.should.equal('Hello world!');
      });

      client1.emit('message', {
        senderId: user1._id,
        groupId: group1._id,
        message: 'Hello world!'
      }, function(err, result) {
        if (err) console.log(err);
      });

      setTimeout(function() { 
        done();
      }, 1000);
    });
  });

  describe('Testing two servers and two clients on different servers', function() {
    var server1 = null
      , server2 = null
      , sockets1 = null
      , sockets2 = null
      , client1 = null
      , client2 = null;

    before(function(done) {
      // create two servers
      server1 = Server(4000);
      server2 = Server(3700);
      sockets1 = socketServer(server1);
      sockets2 = socketServer(server2);
      // create socket.io clients
      client1 = io.connect('http://localhost:3000', options);
      client2 = io.connect('http://localhost:3700', options);
      done();
    });

    after(function(done) {
      server1.close();
      server2.close();
      client1.disconnect();
      client2.disconnect();
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

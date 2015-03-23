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

var expect = require('chai').expect
  , io = require('socket.io-client')
  , express = require('express')
  , app = express()
  , async = require('async')
  , Server = require('../server.js')
  , User = require('../models/User.js')
  , Group = require('../models/Group.js');

describe('Testing socket server', function() {
  var user1 = null
    , user2 = null
    , group1 = null;

  function createUser(username, password, callback) {
    User.new(username, password, callback);
  }

  function getUser(username, callback) {
    User.findOne({ username: username }, callback);
  }

  function saveGroup(group, callback) {
    group.save(function(err, doc) {
      callback(err, doc);
    });
  }

  // create two users and a group and add the two users to the group
  before(function(done) {
    /**
     * Creates two users with usernames 'testuser1' and 'testuser2'
     * @param {function(err)} callback
     */
    function createUsers(callback) {
      async.parallel([
        createUser.bind(null, 'testuser1', 'hello'),
        createUser.bind(null, 'testuser2', 'hello')
      ], function(err) {
        callback(err);
      });
    }

    /**
     * Retrieves and returns the users 'testuser1' and 'testuser2'
     * @param {function(err, user1, user2)} callback
     */
    function getUsers(callback) {
      async.parallel([
        getUser.bind(null, 'testuser1'),
        getUser.bind(null, 'testuser2')
      ], function(err, results) {
        user1 = results[0];
        user2 = results[1];
        callback(err, results[0], results[1]);
      });
    }

    /**
     * User1 creates a new group and user2 joins to the group
     * @param {function(err)} callback
     */
    function createGroup(user1, user2, callback) {
      var group = new Group({
        createdUser: mongoose.Types.ObjectId(user1._id),
        name: 'New group'
      });

      async.waterfall([
        saveGroup.bind(null, group),
        function joinGroup(group, callback) {
          group1 = group;
          user2.joinGroup(group1._id, callback);
        }
      ], function(err) {
        expect(err).to.be.a('null');
        callback(err);
      });
    }

    async.waterfall([ createUsers, getUsers, createGroup ], function(err) {
      expect(err).to.be.a('null');
      done();
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
      redisClient.flushdb();
      done();
    });

    beforeEach(function(done) {
      // create socket.io clients
      client1 = io.connect('http://localhost:3000', options);
      client2 = io.connect('http://localhost:3000', options);

      async.parallel([
        function loginUser1(callback) {
          client1.emit('user:login', {
            username: 'testuser1',
            password: 'hello'
          }, function(err, username) {
            expect(username).to.equal('testuser1');
            return callback(err, username);
          });
        },
        function loginUser2(callback) {
          client2.emit('user:login', {
            username: 'testuser2',
            password: 'hello'
          }, function(err, username) {
            expect(username).to.equal('testuser2');
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
      redisClient.flushdb();
      done();
    });

    afterEach(function(done) {
      client1.disconnect();
      client2.disconnect();
      done();
    });

    it('should properly send message from one socket.io client to the other', function(done) {
      client2.on('message', function(data) {
        expect(data.message.message).to.equal('Hello world!');
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
      var client1Received = false
        , client2Received = false;
      client2.on('message', function(data) {
        expect(data.message.message).to.equal('Hello group world!');
        client2Received = true;
      });
      client1.on('message', function(data) {
        expect(data.message.message).to.equal('Hello group world!');
        client1Received = true;
      });

      client1.emit('message', {
        senderId: user1._id,
        groupId: group1._id,
        message: 'Hello group world!'
      }, function(err, result) {
        if (err) console.log(err);
      });

      setTimeout(function() { 
        expect(client1Received).to.equal(true);
        expect(client2Received).to.equal(true);
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
      server1 = Server(4000);
      server2 = Server(3700);
      redisClient.flushdb();
      done();
    });


    beforeEach(function(done) {
      // create two servers
      // create socket.io clients
      client1 = io.connect('http://localhost:4000', options);
      client2 = io.connect('http://localhost:3700', options);

      async.parallel([
        function loginUser1(callback) {
          client1.emit('user:login', {
            username: 'testuser1',
            password: 'hello'
          }, function(err, username) {
            expect(username).to.equal('testuser1');
            return callback(err, username);
          });
        },
        function loginUser2(callback) {
          client2.emit('user:login', {
            username: 'testuser2',
            password: 'hello'
          }, function(err, username) {
            expect(username).to.equal('testuser2');
            return callback(err, username);
          });
        }
      ], function(err) {
        if (err) console.log(err);
        done();
      });
    });

    after(function(done) {
      server1.close();
      server2.close();
      redisClient.flushdb();
      done();
    });

    afterEach(function(done) {
      client1.disconnect();
      client2.disconnect();
      done();
    });

    it('should properly send message from socket.io client to the other', function(done) {
      client2.on('message', function(data) {
        expect(data.message.message).to.equal('Hello world!');
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
      var client1Received = false
        , client2Received = false;

      client2.on('message', function(data) {
        expect(data.message.message).to.equal('Hello group world!');
        client2Received = true;
      });
      client1.on('message', function(data) {
        expect(data.message.message).to.equal('Hello group world!');
        client1Received = true;
      });

      client1.emit('message', {
        senderId: user1._id,
        groupId: group1._id,
        message: 'Hello group world!'
      }, function(err, result) {
        if (err) console.log(err);
      });

      setTimeout(function() { 
        expect(client1Received).to.equal(true);
        expect(client2Received).to.equal(true);
        done();
      }, 1000);
    });
  });
});

'use strict';
var should = require('should');
var io = require('socket.io-client');
var async = require('async');

var socketURL = 'http://localhost:3700';
var _database = require('../database.js');

var database = new _database('mongodb://localhost:27017/test', true);

var server = require('../index.js');
server.setDebugging();

var options = {
    transports: ['websocket'],
    'force new connection': true
};

describe('Testing Chat Server', function () {
  var client1, client2, client3;
  beforeEach(function(done) {
    database.clearUsers();
    return done();
  });
  afterEach(function(done) {
    database.clearUsers();
    if (client1) {
      client1.disconnect();
    }
    if (client2) {
      client2.disconnect();
    }
    if (client3) {
      client3.disconnect();
    }
    return done();
  });

  // should send back an error
  it('Test chatting without logging in', function(done) {
    client1 = io.connect(socketURL, options);
    client1.on('connect', function() {
      client2 = io.connect(socketURL, options);
      client2.on('connect', function() {
        client1.on('message', function(data) {
          data.error.should.equal('You have to login before chatting');
          return done();
        });
        client1.emit('message', { message: 'test', username: 'test_user' });
      });
    });
  });

  // not logged in client should see public chat message
  it('Test if not logged in client sees public chat message', function(done) {
    client1 = io.connect(socketURL, options);
    var messageSent = false;
    client1.on('signup:message', function () {
      client1.emit('user:login', { username: 'test_user', password: 'hello' });
    });
    client1.on('login:message', function() {
      client1.emit('message', { message: 'test', username: 'test_user' });
      messageSent = true;
    });
    client1.on('connect', function() {
      client2 = io.connect(socketURL, options);
      client2.on('message', function(data) {
        if (messageSent) {
          data.message.should.equal('test');
          return done();
        }
      });
      client2.on('connect', function() {
        client1.emit('user:signup', { username: 'test_user', password: 'hello' });
      });
    });
  });

  // should send back error
  it('Test logging in without signing up', function(done) {
    var messageSent = false;
    client1 = io.connect(socketURL, options);
    client1.on('login:message', function(data) {
      if (messageSent) {
        data.error.should.equal('Your username or password was incorrect');
        return done();
      }
    });
    client1.on('connect', function() {
      client1.emit('user:login', { username: 'test_user', password: 'hello' });
      messageSent = true;
    });
  });

  // should send back 'OK'
  it('Test valid signup to see if it works', function(done) {
    client1 = io.connect(socketURL, options);
    client1.on('signup:message', function(data) {
      data.username.should.equal('test_user');
      return done();
    });
    client1.on('connect', function() {
      client1.emit('user:signup', { username: 'test_user', password: 'hello' });
    });
  });

  // should send back error
  it('Test signing up with a pre existing username', function(done) {
    var messageSent = false;
    client1 = io.connect(socketURL, options);
    client1.on('signup:message', function(data) {
      if (!messageSent) {
        data.username.should.equal('test_user');
        client1.emit('user:signup', { username: 'test_user', password: 'world' });
        messageSent = true;
      } else {
        data.error.should.equal('There is already an account with this username');
        return done();
      }
    });
    client1.on('connect', function() {
      client1.emit('user:signup', { username: 'test_user', password: 'hello' });
    });
  });

  // should send back error
  it('Test signing up with username and password as empty strings', function(done) {
    client1 = io.connect(socketURL, options);
    client1.on('signup:message', function(data) {
      data.error.should.equal('Username or password is empty');
      return done();
    });
    client1.on('connect', function() {
      client1.emit('user:signup', { username: '', password: '' });
    });
  });

  // should send back error
  it('Test signing up with username and password as null strings', function(done) {
    client1 = io.connect(socketURL, options);
    client1.on('signup:message', function(data) {
      data.error.should.equal('Username or password is empty');
      return done();
    });
    client1.on('connect', function() {
      client1.emit('user:signup', { username: null, password: null });
    });
  });

  // should send back error
  it('Test trying to log in user with wrong password', function(done) {
    client1 = io.connect(socketURL, options);
    client1.on('signup:message', function(data) {
      data.username.should.equal('test_user');
      client1.emit('user:login', { username: 'test_user', password: 'world' });
    });
    client1.on('login:message', function(data) {
      data.error.should.equal('Your username or password was incorrect');
      return done();
    });
    client1.on('connect', function() {
      client1.emit('user:signup', { username: 'test_user', password: 'hello' });
    });
  });

  it('Test that other clients get message when client logs in', function(done) {
    var numberOfClients = 0;
    client1 = io.connect(socketURL, options);
    client1.on('signup:message', function() {
      client1.emit('user:login', { username: 'test_user', password: 'hello' });
    });
    client1.on('user:login', function() {
      numberOfClients++;
      if (numberOfClients >= 2) {
        return done();
      }
    });
    client1.on('connect', function() {
      client2 = io.connect(socketURL, options);
      client2.on('user:login', function() {
        numberOfClients++;
        if (numberOfClients >= 2) {
          return done();
        }
      });
      client2.on('connect', function() {
        client1.emit('user:signup', { username: 'test_user', password: 'hello' });
      });
    });
  });

  it('Test that other clients get message when client logs out', function(done) {
    // TODO: implement this
    return done();
  });

  // should send back error
  it('Test logging in as the same user twice on different clients', function(done) {
    client1 = io.connect(socketURL, options);
    client1.on('signup:message', function(data) {
      data.username.should.equal('test_user');
      client1.emit('user:login', { username: 'test_user', password: 'hello' });
    });
    client1.on('login:message', function() {
        client2.emit('user:login', { username: 'test_user', password: 'hello' });
    });
    client1.on('connect', function() {
      client2 = io.connect(socketURL, options);
      client2.on('login:message', function(data) {
        data.error.should.equal('You have already logged in');
        return done();
      });
      client2.on('connect', function() {
        client1.emit('user:signup', { username: 'test_user', password: 'hello' });
      });
    });
  });

  // should send back error
  it('Test if logged in client sends private chat message using another username', function(done) {
    // TODO: implement this
    return done();
  });

  it('Test if logged in client sees private chat message', function(done) {
    client1 = io.connect(socketURL, options);
    var messageSent = false;
    client1.on('signup:message', function () {
      client1.emit('user:login', { username: 'test_user', password: 'hello' });
    });
    client1.on('login:message', function() {
      client2.emit('user:signup', { username: 'test_user2', password: 'hello' });
      messageSent = true;
    });
    client1.on('message', function(data) {
      if (messageSent) {
        data.message.should.equal('test');
        return done();
      }
    });
    client1.on('connect', function() {
      client2 = io.connect(socketURL, options);
      client2.on('signup:message', function() {
        client2.emit('user:login', { username: 'test_user2', password: 'hello' });
      });
      client2.on('login:message', function() {
        messageSent = true;
        client2.emit('message', { message: 'test', username: 'test_user2', receiver: 'test_user' });
      });
      client2.on('connect', function() {
        client1.emit('user:signup', { username: 'test_user', password: 'hello' });
      });
    });
  });

  // client 3 should not see any messages and client 1 and 2 should get their 
  // respective messages
  it('Test if other users can see private chat between two users', function(done) {
    client1 = io.connect(socketURL, options);
    client1.on('signup:message', function() {
      client1.emit('user:login', { username: 'test_user', password: 'hello' });
    });
    client1.on('login:message', function() {
      client2.emit('user:signup', { username: 'test_user2', password: 'hello' });
    });

    var messageSent = false;
    var messageSent2 = false;
    var sawMessage = false;

    client1.on('message', function(data) {
      // if both message have been sent and client 3 hasn't seen any messages
      if (messageSent && messageSent2 && !sawMessage) {
        // verify client 1 gets client 2's message and exit
        if (data.message === 'test2') {
          return done();
        }
      }
    });

    client1.on('connect', function() {
      client2 = io.connect(socketURL, options);
      client2.on('signup:message', function() {
        client2.emit('user:login', { username: 'test_user2', password: 'hello' });
      });
      client2.on('login:message', function() {
        messageSent = true;
        // send message from client 1 to client 2
        client1.emit('message', { message: 'test', username: 'test_user', receiver: 'test_user2' });
      });
      client2.on('message', function(data) {
        if (messageSent) {
          // verify client 2 gets client 1's message
          data.message.should.equal('test');
          messageSent2 = true;
          // send message from client 2 to client 1
          client2.emit('message', { message: 'test2', username: 'test_user2', receiver: 'test_user' });
        }
      });

      client2.on('connect', function() {
        client3 = io.connect(socketURL, options);
        client3.on('message', function(data) {
          if (messageSent && data.message === 'test') {
            sawMessage = true;
          }
        });
        client3.on('connect', function() {
          client1.emit('user:signup', { username: 'test_user', password: 'hello' });
        });
      });
    });
  });
  // TODO: Add more test cases
});

'use strict';
var should = require('should');
var io = require('socket.io-client');
var async = require('async');

var socketURL = 'http://localhost:3700';

var _database = require('../database.js');

var database = new _database('localhost:27017/test', 'users');

var server = require('../index.js');
server.setDebugging();

var options = {
    transports: ['websocket'],
    'force new connection': true
};

describe('Chat Server', function () {
  var client1, client2, client3;
  beforeEach(function(done) {
    database.user_collection.remove({});
    done();
  });
  afterEach(function(done) {
    database.user_collection.remove({});
    if (client1) {
      client1.disconnect();
    }
    if (client2) {
      client2.disconnect();
    }
    if (client3) {
      client3.disconnect();
    }
    console.log("");
    done();
  });

  it('What can be done without logging in', function (done) {
    var testNum = 1;
    client1 = io.connect(socketURL, options);
    client1.on('connect', function (data) {
      client2 = io.connect(socketURL, options);
      client2.on('connect', function (data) {
        client1.on('message', function (data) {
          if (testNum === 1) {
            data.error.should.equal('You have to login before chatting');
            testNum++;
            console.log('Test #1 passed');
            client1.emit('signup', { username: 'test_user', password: 'hello' });
          }
        });
        client1.on('signup-response', function (data) {
          client1.emit('login', { username: 'test_user', password: 'hello' });
        });
        client1.on('login-response', function (data) {
          client1.emit('send', { message: 'test', username: 'test_user' });
        });
        client2.on('message', function (data) {
          if (testNum === 2) {
            data.message.should.equal('test');
            console.log('Test #2 passed');
            done();
          }
        });
        client1.emit('send', { message: 'test', username: 'test_user' });
      });
    });
  });

  it('Login and signup verification', function (done) {
    client1 = io.connect(socketURL, options);
    var testNum = 1;
    var loginParts = 0;
    client1.on('connect', function (data) {
      client2 = io.connect(socketURL, options);
      client2.on('connect', function (data) {
        client1.on('signup-response', function (data) {
          if (testNum === 2) {
            data.response.should.equal("OK");
            testNum++;
            console.log('Test #2 passed');
            client1.emit('signup', { username: 'test_user', password: 'world' });
          } else if (testNum === 3) {
            data.error.should.equal("There is already an account with this username");
            testNum++;
            console.log('Test #3 passed');
            client1.emit('signup', { username: '', password: '' });
          } else if (testNum === 4) {
            data.error.should.equal("Username or password is empty");
            testNum++;
            console.log('Test #4 passed');
            client1.emit('signup', { username: null, password: null });
          } else if (testNum === 5) {
            data.error.should.equal("Username or password is empty");
            testNum++;
            console.log('Test #5 passed');
            client1.emit('login', { username: 'test_user', password: 'world' });
          }
        });
        client1.on('login-response', function (data) {
          if (testNum === 1) {
            data.error.should.equal("You haven't signed up yet");
            console.log('Test #1 passed');
            testNum++;
            client1.emit('signup', { username: 'test_user', password: 'hello' });
          } else if (testNum === 6) {
            data.error.should.equal("Your username or password was incorrect");
            testNum++;
            console.log('Test #6 passed');
            client1.emit('login', { username: 'test_user', password: 'hello' });
          } else if (testNum === 7) {
            if (loginParts === 2) {
              data.error.should.equal("You have already logged in");
              console.log('Test #8 passed');
              done();
            }
          }
        });

        client1.on('userlogin', function (data) {
          if (testNum === 7) {
            data.username.should.equal('test_user');
            console.log('Test #7 part 1 passed');
            loginParts++;
            if (loginParts === 2) 
              client1.emit('login', { username: 'test_user', password: 'hello' });
          }
        });
        client2.on('userlogin', function (data) {
          if (testNum === 7) {
            data.username.should.equal('test_user');
            console.log('Test #7 part 2 passed');
            loginParts++;
            if (loginParts === 2) 
              client1.emit('login', { username: 'test_user', password: 'hello' });
          }
        });
        client1.emit('login', { username: 'test_user', password: 'hello' });
      });
    });
  });
  // TODO: Add more test cases
});

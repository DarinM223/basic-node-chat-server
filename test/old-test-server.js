//'use strict';

//var mongoose = require('mongoose');
//if (mongoose.connection.readyState === 0) {
//  mongoose.connect('mongodb://localhost:27017/test');
//}

//var should = require('should');
//var io = require('socket.io-client');
//var express = require('express');
//var async = require('async');

//var socketURL = 'http://localhost:3700';

//var app = express();

//var sockets = require('../sockets.js')(app, 3700);

//var options = {
//    transports: ['websocket'],
//    'force new connection': true
//};

//describe('Testing Chat Server', function () {
//  var client1, client2, client3;
//  beforeEach(function(done) {
//    sockets.resetEverything();
//    client1 = null;
//    client2 = null; 
//    client3 = null;
//    return done();
//  });
//  afterEach(function(done) {
//    sockets.resetEverything();
//    if (client1) {
//      client1.disconnect();
//    }
//    if (client2) {
//      client2.disconnect();
//    }
//    if (client3) {
//      client3.disconnect();
//    }
//    return done();
//  });

//  describe('Test chatting without logging in', function() {
//    it('should send back an error', function(done) {
//      client1 = io.connect(socketURL, options);
//      client1.on('connect', function() {
//        client2 = io.connect(socketURL, options);
//        client2.on('connect', function() {
//          client1.on('message', function(data) {
//            data.error.should.equal('You have to login before chatting');
//            return done();
//          });
//          client1.emit('message', { message: 'test', username: 'test_user' });
//        });
//      });
//    });
//  });

//  describe('Test if not logged in client sees public chat message', function() {
//    it('not logged in client should see public chat message', function(done) {
//      client1 = io.connect(socketURL, options);
//      var messageSent = false;
//      client1.on('signup:message', function () {
//        client1.emit('user:login', { username: 'test_user', password: 'hello' });
//      });
//      client1.on('login:message', function() {
//        client1.emit('message', { message: 'test', username: 'test_user' });
//        messageSent = true;
//      });
//      client1.on('connect', function() {
//        client2 = io.connect(socketURL, options);
//        client2.on('message', function(data) {
//          if (messageSent) {
//            data.message.should.equal('test');
//            return done();
//          }
//        });
//        client2.on('connect', function() {
//          client1.emit('user:signup', { username: 'test_user', password: 'hello' });
//        });
//      });
//    });
//  });

//  describe('Test logging in without signing up', function() {
//    it('should send back error', function(done) {
//      var messageSent = false;
//      client1 = io.connect(socketURL, options);
//      client1.on('login:message', function(data) {
//        if (messageSent) {
//          data.error.should.equal('Your username or password was incorrect');
//          return done();
//        }
//      });
//      client1.on('connect', function() {
//        client1.emit('user:login', { username: 'test_user', password: 'hello' });
//        messageSent = true;
//      });
//    });
//  });

//  describe('Test valid signup to see if it works', function() {
//    it('should send back username', function(done) {
//      client1 = io.connect(socketURL, options);
//      client1.on('signup:message', function(data) {
//        data.username.should.equal('test_user');
//        return done();
//      });
//      client1.on('connect', function() {
//        client1.emit('user:signup', { username: 'test_user', password: 'hello' });
//      });
//    });
//  });

//  describe('Test signing up with a pre existing username', function() {
//    it('should send back error', function(done) {
//      var messageSent = false;
//      client1 = io.connect(socketURL, options);
//      client1.on('signup:message', function(data) {
//        if (!messageSent) {
//          data.username.should.equal('test_user');
//          client1.emit('user:signup', { username: 'test_user', password: 'world' });
//          messageSent = true;
//        } else {
//          data.error.should.equal('There is already an account with this username');
//          return done();
//        }
//      });
//      client1.on('connect', function() {
//        client1.emit('user:signup', { username: 'test_user', password: 'hello' });
//      });
//    });
//  });

//  describe('Test signing up with username and password as empty strings', function() {
//    it('should send back error', function(done) {
//      client1 = io.connect(socketURL, options);
//      client1.on('signup:message', function(data) {
//        data.error.should.equal('Username or password is empty');
//        return done();
//      });
//      client1.on('connect', function() {
//        client1.emit('user:signup', { username: '', password: '' });
//      });
//    });
//  });

//  describe('Test signing up with username and password as null strings', function() {
//    it('should send back error', function(done) {
//      client1 = io.connect(socketURL, options);
//      client1.on('signup:message', function(data) {
//        data.error.should.equal('Username or password is empty');
//        return done();
//      });
//      client1.on('connect', function() {
//        client1.emit('user:signup', { username: null, password: null });
//      });
//    });
//  });

//  // should send back error
//  describe('Test trying to log in user with wrong password', function() {
//    it('should send back error', function(done) {
//      client1 = io.connect(socketURL, options);
//      client1.on('signup:message', function(data) {
//        data.username.should.equal('test_user');
//        client1.emit('user:login', { username: 'test_user', password: 'world' });
//      });
//      client1.on('login:message', function(data) {
//        data.error.should.equal('Your username or password was incorrect');
//        return done();
//      });
//      client1.on('connect', function() {
//        client1.emit('user:signup', { username: 'test_user', password: 'hello' });
//      });
//    });
//  });

//  describe('Test that other clients get message when client logs in', function() {
//    it('should notify other user that user logged in', function(done) {
//      client1 = io.connect(socketURL, options);
//      client1.on('signup:message', function() {
//        client1.emit('user:login', { username: 'test_user', password: 'hello' });
//      });
//      client1.on('connect', function() {
//        client2 = io.connect(socketURL, options);
//        client2.on('user:login', function(data) {
//          data.username.should.equal('test_user');
//          return done();
//        });
//        client2.on('connect', function() {
//          client1.emit('user:signup', { username: 'test_user', password: 'hello' });
//        });
//      });
//    });
//  });

//  describe('Test that other clients get message when client logs out', function() {
//    it('should notify other user that user logged out', function(done) {
//      client1 = io.connect(socketURL, options);
//      client1.on('signup:message', function() {
//        client1.emit('user:login', { username: 'test_user', password: 'hello' });
//      });
//      client1.on('user:login', function() {
//        client1.disconnect();
//      });
//      client1.on('connect', function() {
//        client2 = io.connect(socketURL, options);
//        client2.on('user:logout', function(data) {
//          data.username.should.equal('test_user');
//          return done();
//        });
//        client2.on('connect', function() {
//          client1.emit('user:signup', { username: 'test_user', password: 'hello' });
//        });
//      });
//    });
//  });

//  describe('Test logging in as the same user twice on different clients', function() {
//    it('should send back an error', function(done) {
//      client1 = io.connect(socketURL, options);
//      client1.on('signup:message', function(data) {
//        data.username.should.equal('test_user');
//        client1.emit('user:login', { username: 'test_user', password: 'hello' });
//      });
//      client1.on('login:message', function() {
//          client2.emit('user:login', { username: 'test_user', password: 'hello' });
//      });
//      client1.on('connect', function() {
//        client2 = io.connect(socketURL, options);
//        client2.on('login:message', function(data) {
//          data.error.should.equal('You have already logged in');
//          return done();
//        });
//        client2.on('connect', function() {
//          client1.emit('user:signup', { username: 'test_user', password: 'hello' });
//        });
//      });
//    });
//  });

//  describe('Test if logged in client sends private chat message using another username', function() {
//    it('should send back an error', function(done) {
//      var messageSent = false;
//      client1 = io.connect(socketURL, options);
//      client1.on('signup:message', function () {
//        client1.emit('user:login', { username: 'test_user', password: 'hello' });
//      });
//      client1.on('login:message', function() {
//        client2.emit('user:signup', { username: 'test_user2', password: 'hello' });
//      });
//      client1.on('connect', function() {
//        client2 = io.connect(socketURL, options);
//        client2.on('signup:message', function() {
//          client2.emit('user:login', { username: 'test_user2', password: 'hello' });
//        });
//        client2.on('login:message', function() {
//          messageSent = true;
//          client2.emit('message', { message: 'test', username: 'test_user', receiver: 'test_user' });
//        });
//        client2.on('message', function(data) {
//          if (messageSent) {
//            data.error.should.equal('You have to login before chatting');
//            return done();
//          }
//        });
//        client2.on('connect', function() {
//          client1.emit('user:login', { username: 'test_user', password: 'hello' });
//        });
//      });
//    });
//  });

//  describe('Test if logged in client sees private chat message', function() {
//    it('logged in clients should see private messages sent to them', function(done) {
//      client1 = io.connect(socketURL, options);
//      var messageSent = false;
//      client1.on('signup:message', function () {
//        client1.emit('user:login', { username: 'test_user', password: 'hello' });
//      });
//      client1.on('login:message', function() {
//        client2.emit('user:signup', { username: 'test_user2', password: 'hello' });
//        messageSent = true;
//      });
//      client1.on('message', function(data) {
//        if (messageSent) {
//          data.message.should.equal('test');
//          return done();
//        }
//      });
//      client1.on('connect', function() {
//        client2 = io.connect(socketURL, options);
//        client2.on('signup:message', function() {
//          client2.emit('user:login', { username: 'test_user2', password: 'hello' });
//        });
//        client2.on('login:message', function() {
//          messageSent = true;
//          client2.emit('message', { message: 'test', username: 'test_user2', receiver: 'test_user' });
//        });
//        client2.on('connect', function() {
//          client1.emit('user:signup', { username: 'test_user', password: 'hello' });
//        });
//      });
//    });
//  });

//  describe('Test if other users can see private chat between two users', function() {
//    it('client 3 should not see any private messages b/w client 1 & 2', function(done) {
//      setTimeout(done, 5000);
//      client1 = io.connect(socketURL, options);
//      client1.on('signup:message', function() {
//        client1.emit('user:login', { username: 'test_user', password: 'hello' });
//      });
//      client1.on('login:message', function() {
//        client2.emit('user:signup', { username: 'test_user2', password: 'hello' });
//      });

//      var messageSent = false;
//      var messageSent2 = false;
//      var sawMessage = false;

//      client1.on('message', function(data) {
//        // if both message have been sent and client 3 hasn't seen any messages
//        if (messageSent2 && !sawMessage) {
//          // verify client 1 gets client 2's message and exit
//          if (data.message === 'test2') {
//            return done();
//          }
//        }
//      });

//      client1.on('connect', function() {
//        client2 = io.connect(socketURL, options);
//        client2.on('signup:message', function() {
//          client2.emit('user:login', { username: 'test_user2', password: 'hello' });
//        });
//        client2.on('login:message', function() {
//          messageSent = true;
//          // send message from client 1 to client 2
//          client1.emit('message', { message: 'test', username: 'test_user', receiver: 'test_user2' });
//        });
//        client2.on('message', function(data) {
//          if (messageSent) {
//            // verify client 2 gets client 1's message
//            data.message.should.equal('test');
//            messageSent2 = true;
//            // send message from client 2 to client 1
//            client2.emit('message', { message: 'test2', username: 'test_user2', receiver: 'test_user' });
//          }
//        });

//        client2.on('connect', function() {
//          client3 = io.connect(socketURL, options);
//          client3.on('message', function(data) {
//            if (messageSent && data.message === 'test') {
//              sawMessage = true;
//            }
//          });
//          client3.on('connect', function() {
//            client1.emit('user:signup', { username: 'test_user', password: 'hello' });
//          });
//        });
//      });
//    });
//  });
//});

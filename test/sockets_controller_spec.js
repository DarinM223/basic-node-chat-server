'use strict';

var mongoose = require('mongoose');
if (mongoose.connection.readyState === 0) {
  mongoose.connect('mongodb://localhost:27017/test');
}

var redisClient = require('../redis/redisClient.js')(true); // test client

var paths = [
  '../controllers/sockets_controller.js'
];

// delete caches that might affect stuff
for (var i = 0; i < paths.length; i++) {
  var path = require.resolve(paths[i]);
  if (require.cache[path]) {
    console.log('Deleting ' + path);
    delete require.cache[path];
  }
}

var should = require('should')
  , sockets = require('../controllers/sockets_controller.js')
  , socketManager = require('../socketManager.js')()
  , User = require('../models/User.js')
  , Group = require('../models/Group.js');


describe('Testing sockets', function() {


  describe('Test handleUserLogin', function() {
    var _userid = null;
    before(function(done) {
      redisClient.flushdb();
      socketManager.reset();

      User.new('newuser', 'hello', function(err, success) {
        sockets.handleUserLogin('1234', 'newuser', 'hello', socketManager, function(err, userid) {
          (err === null).should.be.true;
          (userid !== null).should.be.true;
          _userid = userid;
          done();
        });
      });

    });
    after(function(done) {
      redisClient.flushdb();
      socketManager.reset();
      sockets.resetEverything(socketManager);
      done();
    });

    /*
     * TODO: add tests if username/password doesn't match
     */

    it('should add socket manager k/v pair', function(done) {
      socketManager.hasSocketId('1234').should.be.true;
      socketManager.getUserId('1234').should.equal(_userid);
      done();
    });

    it('should display error if already logged in', function(done) {
      sockets.handleUserLogin('1234', 'newuser', 'hello', socketManager, function(err, userid) {
        err.message.should.equal('You have already logged in');
        done();
      });
    });

    it('should set login key', function(done) {
      redisClient.get('login:' + _userid, function(err, result) {
        result.should.equal(1);
        done();
      });
    });
  });


  describe('Test handleMessage', function() {
    it('should work', function(done) {
      done();
    });
  });


  describe('Test handleDisconnect', function() {
    var _userid = null;
    before(function(done) {
      redisClient.flushdb();
      socketManager.reset();

      // create and log in test user
      User.new('newuser', 'hello', function(err, success) {
        sockets.handleUserLogin('1234', 'newuser', 'hello', socketManager, function(err, userid) {
          (err === null).should.be.true;
          _userid = userid;
          done();
        });
      });
    });

    after(function(done) {
      // remove users
      redisClient.flushdb();
      socketManager.reset();
      User.remove({}, function() {
        done();
      });
    });

    it('should fail if there is no socket id', function(done) {
      sockets.handleDisconnect('4567', socketManager, function(err, disconnected_uid) {
        err.message.should.equal('There is no user associated with this socket id');
        (disconnected_uid === null).should.be.true;
        done();
      });
    });

    it('should remove the login key and socket manager k/v pair in redis', function(done) {
      redisClient.get('login:' + _userid, function(err, result) {
        (err === null).should.be.true;
        result.should.equal(1);
        sockets.handleDisconnect('1234', socketManager, function(err, disconnected_uid) {
          redisClient.get('login:' + _userid, function(err, result) {
            (err === null).should.be.true;
            (result === null).should.be.true;
            socketManager.hasSocketId('1234').should.be.false;
            done();
          });
        });
      });
    });
  });
});

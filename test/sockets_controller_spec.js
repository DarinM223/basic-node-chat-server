'use strict';

var mongoose = require('mongoose');
if (mongoose.connection.readyState === 0) {
  mongoose.connect('mongodb://localhost:27017/test');
}

var redisClient = require('../redis/redisClient.js')(false); // test client

var should = require('should')
  , Promise = require('bluebird')
  , SocketManager = require('../SocketManager.js')
  , socketManager = new SocketManager()
  , SocketsController = require('../controllers/sockets_controller.js')
  , sockets = Promise.promisifyAll(new SocketsController(socketManager))
  , User = Promise.promisifyAll(require('../models/User.js'))
  , Group = require('../models/Group.js');

redisClient = Promise.promisifyAll(redisClient);

describe('Testing sockets', function() {
  describe('Test handleUserLogin', function() {
    var _userid = null;
    before(function(done) {
      redisClient.flushdb();
      socketManager.reset();

      User.newAsync('newuser', 'hello').then(function(success) {
        return sockets.handleUserLoginAsync('1234', 'newuser', 'hello');
      }).then(function(userid) {
        (userid !== null).should.be.true;
        _userid = userid;
        done();
      }).catch(function(e) {
        console.log(e);
      });
    });

    after(function(done) {
      redisClient.flushdb();
      socketManager.reset();
      sockets.resetEverything();
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
      sockets.handleUserLogin('1234', 'newuser', 'hello', function(err, userid) {
        err.message.should.equal('You have already logged in');
        done();
      });
    });

    it('should set login key', function(done) {
      redisClient.get('login:' + _userid, function(err, result) {
        JSON.parse(result).should.equal(1);
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

      User.newAsync('newuser', 'hello').then(function(success) {
        return sockets.handleUserLoginAsync('1234', 'newuser', 'hello');
      }).then(function(userid) {
        _userid = userid;
        done();
      }).catch(function(e) {
        console.log(e);
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
      sockets.handleDisconnect('4567', function(err, disconnected_uid) {
        err.message.should.equal('There is no user associated with this socket id');
        (disconnected_uid === null).should.be.true;
        done();
      });
    });

    it('should remove the login key and socket manager k/v pair in redis', function(done) {
      redisClient.getAsync('login:' + _userid).then(function(result) {
        JSON.parse(result).should.equal(1);
        return sockets.handleDisconnectAsync('1234');
      }).then(function() {
        return redisClient.getAsync('login:' + _userid);
      }).then(function(result) {
        (result === null).should.be.true;
        socketManager.hasSocketId('1234').should.be.false;
        done();
      }).catch(function(e) {
        console.log(e);
      });
    });
  });
});

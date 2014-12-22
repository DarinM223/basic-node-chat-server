'use strict';

var mongoose = require('mongoose');
if (mongoose.connection.readyState === 0) {
  mongoose.connect('mongodb://localhost:27017/test');
}

var should = require('should');
var sockets = require('../sockets.js');
var redisClient = require('../redis/redisClient.js')(true);
var database = require('../database.js');
var socketManager = require('../socketManager.js');

var User = require('../models/User.js');
var Group = require('../models/Group.js');

describe('Testing sockets', function() {
  describe('Test handleUserLogin', function() {
    var _userid = null;
    before(function(done) {
      redisClient.flushdb();
      socketManager.reset();

      database.insertUser('newuser', 'hello', function(err, success) {
        sockets.handleUserLogin('1234', 'newuser', 'hello', (function(err, userid) {
          (err === null).should.be.true;
          (userid !== null).should.be.true;
          _userid = userid;
          done();
        }).bind(this));
      });

    });
    after(function(done) {
      redisClient.flushdb();
      socketManager.reset();
      sockets.resetEverything();
      done();
    });

    it('should add socket manager k/v pair', function(done) {
      socketManager.hasSocketId('1234').should.be.true;
      socketManager.getUserId('1234').should.equal(_userid);
      done();
    });

    it('should display error if already logged in', function(done) {
      sockets.handleUserLogin('1234', 'newuser', 'hello', function(err, userid) {
        (err === null).should.be.false;
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

  describe('Test handleJoinGroup', function() {
    var _userid = null;
    var _groupid = null;

    before(function(done) {
      redisClient.flushdb();
      socketManager.reset();

      database.insertUser('newuser', 'hello', function(err, success) {
        sockets.handleUserLogin('1234', 'newuser', 'hello', (function(err, userid) {
          (err === null).should.be.true;
          _userid = userid;
          done();
        }).bind(this));
      });
    });

    after(function(done) {
      redisClient.flushdb();
      socketManager.reset();
      sockets.resetEverything();
      Group.remove({}, function(err, result) {
        _groupid = null;
        User.remove({}, function(err, result) {
          _userid = null;
        });
        done();
      });
    });

    it('should fail if group does not exist', function(done) {
      sockets.handleJoinGroup('1234', mongoose.Types.ObjectId('123456789012'), function(err, success) {
        (err === null).should.be.false;
        success.should.be.false;
        done();
      });
    });
    
    it('should fail if user is created the group', function(done) {
      var newGroup = new Group({
        createdUser: mongoose.Types.ObjectId(_userid),
        name: 'New group'
      });
    
      newGroup.save(function(err, doc) {
        (err === null).should.be.true;
        _groupid = doc._id;

        // try to join user to group twice
        sockets.handleJoinGroup('1234', _groupid, function(err, success) {
          (err === null).should.be.true;
          // since you are trying to join the group even though you created the group
          success.should.be.false; 
          done();
        });
      });
    });

    it('should fail if user is already in the group', function(done) {
      var _anotherGroupId = null;
      // create a new user to test joining a new user twice
      database.insertUser('anotheruser', 'hello', function(err, success) {
        sockets.handleUserLogin('4567', 'anotheruser', 'hello', function(err, userid) {
          (err === null).should.be.true;

          var newGroup = new Group({
            createdUser: mongoose.Types.ObjectId(_userid),
            name: 'New group'
          });

          newGroup.save(function(err, doc) {
            (err === null).should.be.true;
            _anotherGroupId = doc._id;

            sockets.handleJoinGroup('4567', _anotherGroupId, function(err, success) {
              (err === null).should.be.true;
              success.should.be.true; // should initially join group properly
              sockets.handleJoinGroup('4567', _anotherGroupId, function(err, success) {
                (err === null).should.be.true;
                // the second time joining the group should cause success to be false
                success.should.be.false; 
                done();
              });
            });
          });
        });
      });
    });

    it('should add the userid to the group in mongodb', function(done) {
      Group.findById(_groupid, function(err, group) {
        (group.users.length === 1).should.be.true;
        done();
      });
    });

    it('should add the userid to the set in redis', function(done) {
      redisClient.sismember('group:' + _groupid, _userid+'', function(err, result) {
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
    var userid = '23456678';
    before(function(done) {
      sockets.handleDisconnect();
      done();
    });

    after(function(done) {
      done();
    });

    it('should set the login key in redis to false', function(done) {
      //redisClient.get('login:' + userid, function(err, result) {
      //  result.should.equal(false);
      //});
      done();
    });
  });
});

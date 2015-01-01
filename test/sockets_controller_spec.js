'use strict';

var mongoose = require('mongoose');
if (mongoose.connection.readyState === 0) {
  mongoose.connect('mongodb://localhost:27017/test');
}

var should = require('should');
var sockets = require('../controllers/sockets_controller.js');
var redisClient = require('../redis/redisClient.js')(true);
var socketManager = require('../socketManager.js');

var User = require('../models/User.js');
var Group = require('../models/Group.js');

describe('Testing sockets', function() {


  describe('Test handleUserLogin', function() {
    var _userid = null;
    before(function(done) {
      redisClient.flushdb();
      socketManager.reset();

      User.new('newuser', 'hello', function(err, success) {
        sockets.handleUserLogin('1234', 'newuser', 'hello', function(err, userid) {
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
        result.should.equal(1);
        done();
      });
    });
  });


  describe('Test handleJoinGroup', function() {
    var _userid = null;
    var _groupid = null;

    beforeEach(function(done) {
      redisClient.flushdb();
      socketManager.reset();

      User.new('newuser', 'hello', function(err, success) {
        sockets.handleUserLogin('1234', 'newuser', 'hello', function(err, userid) {
          (err === null).should.be.true;
          _userid = userid;
          done();
        });
      });
    });

    afterEach(function(done) {
      redisClient.flushdb();
      socketManager.reset();
      sockets.resetEverything();
      Group.remove({}, function(err, result) {
        _groupid = null;
        User.remove({}, function(err, result) {
          _userid = null;
          done();
        });
      });
    });

    it('should add the userid to the group in mongodb', function(done) {
      var newGroup = new Group({
        createdUser: mongoose.Types.ObjectId(_userid),
        name: 'New group'
      });
      newGroup.save(function(err, doc) {
        (err === null).should.be.true;
        User.new('anotheruser', 'hello', function(err, success) {
          sockets.handleUserLogin('4567', 'anotheruser', 'hello', function(err, userid) {
            _groupid = doc._id;
            sockets.handleJoinGroup('4567', _groupid, function(err, success) {
              success.should.be.true;
              Group.findById(_groupid, function(err, group) {
                (group.users.length === 1).should.be.true;
                done();
              });
            });
          });
        });
      });
    });

    it('should fail if group does not exist', function(done) {
      sockets.handleJoinGroup('1234', mongoose.Types.ObjectId('123456789012'), function(err, success) {
        err.message.should.equal('Group does not exist');
        success.should.be.false;
        done();
      });
    });
    
    it('should fail if user created the group', function(done) {
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
      User.new('anotheruser', 'hello', function(err, success) {
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
        sockets.handleUserLogin('1234', 'newuser', 'hello', function(err, userid) {
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
      sockets.handleDisconnect('4567', function(err, disconnected_uid) {
        err.message.should.equal('There is no user associated with this socket id');
        (disconnected_uid === null).should.be.true;
        done();
      });
    });

    it('should remove the login key in redis', function(done) {
      redisClient.get('login:' + _userid, function(err, result) {
        (err === null).should.be.true;
        result.should.equal(1);
        sockets.handleDisconnect('1234', function(err, disconnected_uid) {
          redisClient.get('login:' + _userid, function(err, result) {
            (err === null).should.be.true;
            (result === null).should.be.true;
            done();
          });
        });
      });
    });
  });
});

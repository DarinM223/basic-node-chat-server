'use strict';

var mongoose = require('mongoose');
if (mongoose.connection.readyState === 0) {
  mongoose.connect('mongodb://localhost:27017/test');
}

var should = require('should')
  , User = require('../models/User.js')
  , JoinedUser = require('../models/JoinedUser.js')
  , Group = require('../models/Group.js')
  , async = require('async');

describe('Testing User model', function() {
  beforeEach(function(done) {
    User.collection.remove({}, function(err, result) {done();});
  });
  afterEach(function(done) {
    User.collection.remove({}, function(err, result) {done();});
  });

  describe('Test valid insertion', function() {
    it('should properly hash password and insert user', function(done) {
      User.find({}, function(err, docs) {
        docs.length.should.equal(0);
        User.new('test_user', 'hello', function(err, isSuccess) {
          isSuccess.should.equal(true);
          User.find({}, function(err, docs) {
            docs.length.should.equal(1);
            docs[0].username.should.equal('test_user');
            docs[0].comparePassword('hello', function(err, isPasswordMatch) {
              isPasswordMatch.should.equal(true);
              return done();
            });
          });
        });
      });
    });
  });

  describe('Test invalid insertion', function() {
    it('should prevent from inserting same username twice', function(done) {
      User.new('test_user', 'hello', function(err, isSuccess) {
        isSuccess.should.equal(true);
        User.new('test_user', 'world', function(err, isSuccess) {
          isSuccess.should.equal(false);
          return done();
        });
      });
    });
  });

  describe('Test verification of user that does not exist', function() {
    it('should return false', function(done) {
      User.verify('test_user', 'hello', function(err, user) {
        (user === null).should.equal(true);
        return done();
      });
    });
  });

  describe('Test entering wrong password for user', function() {
    it('should return false', function(done) {
      User.new('test_user', 'hello', function(err, isSuccess) {
        isSuccess.should.equal(true);
        User.verify('test_user', 'world', function(err, user) {
          (user === null).should.be.true;
          return done();
        });
      });
    });
  });

  describe('Test valid verification', function() {
    it('should insert user into database and correctly check password', function(done) {
      User.new('test_user', 'hello', function(err, isSuccess) {
        isSuccess.should.equal(true);
        User.verify('test_user', 'hello', function(err, user) {
          (user !== null).should.be.true;
          return done();
        });
      });
    });
  });

  describe('Test joining group', function() {
    it('should add new entry to JoinedUser collection', function(done) {
      async.waterfall([
        function(callback) {
          User.new('test_user', 'hello', function(err, isSuccess) {
            isSuccess.should.equal(true);
            callback(err);
          });
        },
        function(callback) {
          User.verify('test_user', 'hello', function(err, user) {
            (user !== null).should.be.true;
            return callback(err, user);
          });
        },
        function(user, callback) {
          user.joinGroup('123456789012', function(err) {
            return callback(err, user);
          });
        },
        function(user, callback) {
          user.joinedGroups(function(err, groupids) {
            groupids.length.should.equal(1);
            groupids[0].equals(mongoose.Types.ObjectId('123456789012')).should.be.true;
            return callback(err);
          });
        }
      ], function(err) {
        if (err !== null) console.log(err);
        done();
      });
    });
  });

  describe('Test getting created groups', function() {
    it('should return all created group ids', function(done) {
      async.waterfall([
        function(callback) {
          User.new('test_user', 'hello', function(err, isSuccess) {
            isSuccess.should.be.true;
            return callback(err);
          });
        },
        function(callback) {
          User.verify('test_user', 'hello', function(err, user) {
            (user !== null).should.be.true;
            return callback(err, user);
          });
        },
        function(user, callback) {
          var group1 = new Group({
            createdUser: user._id,
            name: 'Group 1'
          });
          group1.save(function(err) {
            return callback(err, user, group1);
          });
        },
        function(user, group1, callback) {
          var group2 = new Group({
            createdUser: user._id,
            name: 'Group 2'
          });
          group2.save(function(err) {
            return callback(err, user, group1, group2);
          });
        },
        function(user, group1, group2, callback) {
          user.createdGroups(function(err, groupids) {
            groupids.length.should.equal(2);
            groupids[0].equals(group1._id).should.be.true;
            groupids[1].equals(group2._id).should.be.true;
            return callback(err);
          });
        }
      ], function(err) {
        if (err !== null) console.log(err);
        done();
      });
    });
  });
});

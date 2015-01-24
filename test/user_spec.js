'use strict';

var mongoose = require('mongoose');
if (mongoose.connection.readyState === 0) {
  mongoose.connect('mongodb://localhost:27017/test');
}

var should = require('should')
  , User = require('../models/User.js');

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
});

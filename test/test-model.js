'use strict';

var should = require('should');
var _database = require('../database.js');
var database = new _database('mongodb://localhost:27017/test', true);

describe('Testing model', function() {
  beforeEach(function(done) {
    database.clearUsers();
    done();
  });
  afterEach(function(done) {
    database.clearUsers();
    done();
  });

  describe('Test valid insertion', function() {
    it('should properly hash password and insert user', function(done) {
      database.listUsers(function(err, docs) {
        docs.length.should.equal(0);
        database.insertUser('test_user', 'hello', function(err, isSuccess) {
          isSuccess.should.equal(true);
          database.listUsers(function(err, docs) {
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
      database.insertUser('test_user', 'hello', function(err, isSuccess) {
        isSuccess.should.equal(true);
        database.insertUser('test_user', 'world', function(err, isSuccess) {
          isSuccess.should.equal(false);
          return done();
        });
      });
    });
  });

  describe('Test verification of user that does not exist', function() {
    it('should return false', function(done) {
      database.verifyUser('test_user', 'hello', function(err, isSuccess) {
        isSuccess.should.equal(false);
        return done();
      });
    });
  });

  describe('Test entering wrong password for user', function() {
    it('should return false', function(done) {
      database.insertUser('test_user', 'hello', function(err, isSuccess) {
        isSuccess.should.equal(true);
        database.verifyUser('test_user', 'world', function(err, isSuccess) {
          isSuccess.should.equal(false);
          return done();
        });
      });
    });
  });

  describe('Test valid verification', function() {
    it('should insert user into database and correctly check password', function(done) {
      database.insertUser('test_user', 'hello', function(err, isSuccess) {
        isSuccess.should.equal(true);
        database.verifyUser('test_user', 'hello', function(err, isSuccess) {
          isSuccess.should.equal(true);
          return done();
        });
      });
    });
  });
});

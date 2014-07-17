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

  it('Test valid insertion', function(done) {
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

  it('Test invalid insertion', function(done) {
    database.insertUser('test_user', 'hello', function(err, isSuccess) {
      isSuccess.should.equal(true);
      database.insertUser('test_user', 'world', function(err, isSuccess) {
        isSuccess.should.equal(false);
        return done();
      });
    });
  });

  it('Test verification of user that does not exist', function(done) {
    database.verifyUser('test_user', 'hello', function(err, isSuccess) {
      isSuccess.should.equal(false);
      return done();
    });
  });

  it('Test entering wrong password for user', function(done) {
    database.insertUser('test_user', 'hello', function(err, isSuccess) {
      isSuccess.should.equal(true);
      database.verifyUser('test_user', 'world', function(err, isSuccess) {
        isSuccess.should.equal(false);
        return done();
      });
    });
  });

  it('Test valid verification', function(done) {
    database.insertUser('test_user', 'hello', function(err, isSuccess) {
      isSuccess.should.equal(true);
      database.verifyUser('test_user', 'hello', function(err, isSuccess) {
        isSuccess.should.equal(true);
        return done();
      });
    });
  });
});

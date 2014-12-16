'use strict';

var should = require('should');
var Chat = require('../models/Chat.js');
var redisClient = require('../redis/redisClient.js')(true); // test client

// uses test client after the statement before it turns on "testing mode"
var redisManager = require('../redisManager.js'); 

describe('Testing redis publication functions', function() {
  beforeEach(function(done) {
    done();
  });
  afterEach(function(done) {
    done();
  });

  describe('Test addIndividualMessage', function() {
    before(function(done) {
      done();
    });
    it('should add message to mongodb and redis', function(done) {
      done();
    });

    it('should update receivers unread messages in mongodb and redis', function(done) {
      done();
    });

    it('should cache the number of unread messages if not already', function(done) {
      done();
    });
  });

  describe('Test editIndividualMessage', function() {
    it('should update the message in mongodb and redis', function(done) {
      done();
    });
  });

  describe('Test hasGroup', function() {
    it('should check if there is a group in mongodb and redis', function(done) {
      done();
    });
  });
});

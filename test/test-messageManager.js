'use strict';

var should = require('should');
var Chat = require('../models/Chat.js');
var redisClient = require('redis').createClient();
var messageManager = require('../messageManager.js');

describe('Testing redis publication functions', function() {
  beforeEach(function(done) {
    done();
  });
  afterEach(function(done) {
    done();
  });

  describe('Test addIndividualMessage', function() {
    it('should add message to mongodb and redis', function(done) {
      done();
    });

    it('should receive published message add', function(done) {
      done();
    });

    it('should update receivers unread messages in mongodb and redis', function(done) {
      done();
    });

    it('if the unread messages are cached if not already', function(done) {
      done();
    });
  });

  describe('Test editIndividualMessage', function() {
    it('should update the message in mongodb and redis', function(done) {
      done();
    });

    it('should receive published message edit', function(done) {
      done();
    });
  });
});

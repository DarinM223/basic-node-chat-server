'use strict';

var mongoose = require('mongoose');
if (mongoose.connection.readyState === 0) {
  mongoose.connect('mongodb://localhost:27017/test');
}

var should = require('should');
var Chat = require('../models/Chat.js');
var Group = require('../models/Group.js');
var redisClient = require('../redis/redisClient.js')(true); // test client

var async = require('async');

// uses test client after the statement before it turns on "testing mode"
var redisManager = require('../redisManager.js'); 

describe('Testing redis publication functions', function() {
  describe('Test addIndividualMessage', function() {
    var messageid = null;
    // add a new test message
    before(function(done) {
      redisClient.flushdb();
      Chat.remove({}, function(err, result) {
        var message = {
          senderId: mongoose.Types.ObjectId('123456789012'),
          receiverId: mongoose.Types.ObjectId('456789012345'),
          groupId: null,
          message: 'New message'
        };
        redisManager.addIndividualMessage(message , function(err, result) {
          (err === null).should.be.true;
          (result !== null).should.be.true;
          messageid = result;
          done();
        });
      });
    });

    // clear redis and mongodb after done
    after(function(done) {
      redisClient.flushdb();
      Chat.remove({}, function(err, result) {
        done();
      });
    });

    it('should add message to mongodb', function(done) {
      Chat.findById(messageid, function(err, doc) {
        if (err) return callback(err, null);
        mongoose.Types.ObjectId(doc.receiverId).equals(mongoose.Types.ObjectId('456789012345')).should.be.true;
        mongoose.Types.ObjectId(doc.senderId).equals(mongoose.Types.ObjectId('123456789012')).should.be.true;
        (doc.groupId === null).should.be.true;
        doc.message.should.equal('New message');
        done();
      });
    });

    it('should add message to redis', function(done) {
      redisClient.get('message:' + messageid, function(err, strValue) {
        var value = JSON.parse(strValue);
        if (err) return callback(err, false);
        mongoose.Types.ObjectId(value.senderId).equals(mongoose.Types.ObjectId('123456789012')).should.be.true;
        mongoose.Types.ObjectId(value.receiverId).equals(mongoose.Types.ObjectId('456789012345')).should.be.true;
        (value.groupId === null).should.be.true;
        value.message.should.equal('New message');
        done();
      });
    });

    it('should update receivers unread messages in redis', function(done) {
      redisClient.get('user:unread:' + mongoose.Types.ObjectId('456789012345'), function(err, value) {
        value.should.equal(1);
        done();
      });
    });
  });

  describe('Test editIndividualMessage', function() {
    var messageid = null;
    // add a new test message
    before(function(done) {
      redisClient.flushdb();
      Chat.remove({}, function(err, result) {
        var message = {
          senderId: mongoose.Types.ObjectId('123456789012'),
          receiverId: mongoose.Types.ObjectId('456789012345'),
          groupId: null,
          message: 'New message'
        };
        redisManager.addIndividualMessage(message , function(err, result) {
          (err === null).should.be.true;
          (result !== null).should.be.true;
          messageid = result;
          redisManager.editIndividualMessage(messageid, 'Changed message', function(err, result) {
            result.should.be.true;
            done();
          });
        });
      });
    });

    // clear redis and mongodb after done
    after(function(done) {
      redisClient.flushdb();
      Chat.remove({}, function(err, result) {
        done();
      });
    });

    it('should update the message in mongodb', function(done) {
      Chat.findById(messageid, function(err, doc) {
        if (!err && doc) {
          mongoose.Types.ObjectId(doc.receiverId).equals(mongoose.Types.ObjectId('456789012345')).should.be.true;
          mongoose.Types.ObjectId(doc.senderId).equals(mongoose.Types.ObjectId('123456789012')).should.be.true;
          (doc.groupId === null).should.be.true;

          doc.message.should.equal('Changed message');
          done();
        }
      });
    });

    it('should update the message in redis', function(done) {
      redisClient.get('message:' + messageid, function(err, strValue) {
        var value = JSON.parse(strValue);
        if (err) return callback(err, false);
        mongoose.Types.ObjectId(value.senderId).equals(mongoose.Types.ObjectId('123456789012')).should.be.true;
        mongoose.Types.ObjectId(value.receiverId).equals(mongoose.Types.ObjectId('456789012345')).should.be.true;
        (value.groupId === null).should.be.true;
        value.message.should.equal('Changed message');
        done();
      });
    });
  });

  describe('Test hasGroup', function() {
    var groupid = null;
    beforeEach(function(done) {
      redisClient.flushdb();
      Group.remove({}, function(err, result) {
        // add a new group
        var group = new Group({
            createdUser: mongoose.Types.ObjectId('123456789012'),
            name: 'New group',
        });
        group.save(function(err, doc) {
          (err === null).should.be.true;
          groupid = doc._id;
          done();
        });
      });
    });
    afterEach(function(done) {
      redisClient.flushdb();
      Group.remove({}, function(err, result) {
        done();
      });
    });

    it('should return true if there is a group', function(done) {
      redisManager.hasGroup(groupid, function(err, result) {
        result.should.be.true;
        done();
      });
    });

    it('should return false if there is not a group', function(done) {
      redisClient.flushdb();
      Group.remove({}, function(err, result) {
        redisManager.hasGroup(groupid, function(err, result) {
          result.should.be.false;
          done();
        });
      });
    });

    it('should add group to cache if not already', function(done) {
      redisClient.smembers('group:' + groupid, function(err, members) {
        members.length.should.equal(0);
        redisManager.hasGroup(groupid, function(err, result) {
          result.should.be.true;
          redisClient.smembers('group:' + groupid, function(err, members) {
            (err === null).should.be.true;
            members.length.should.equal(1);
            done();
          });
        });
      });
    });
  });
});

'use strict';

var mongoose = require('mongoose');
if (mongoose.connection.readyState === 0) {
  mongoose.connect('mongodb://localhost:27017/test');
}

var redisClient = require('../redis/redisClient.js')(true); // test client

var should = require('should');
var Chat = require('../models/Chat.js');
var User = require('../models/User.js');
var Group = require('../models/Group.js');

var async = require('async');

describe('Testing Chat functions', function() {
  describe('Test Chat.new', function() {
    var messageid = null;
    // add a new test message
    before(function(done) {
      redisClient.flushdb();
      Chat.remove({}, function() {
        var message = {
          senderId: mongoose.Types.ObjectId('123456789012'),
          receiverId: mongoose.Types.ObjectId('456789012345'),
          groupId: null,
          message: 'New message'
        };
        Chat.new(message , function(err, result) {
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
      Chat.remove({}, function() {
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

    it('should update receivers unread messages in redis', function(done) {
      redisClient.get('user:unread:' + mongoose.Types.ObjectId('456789012345'), function(err, value) {
        value.should.equal(1);
        done();
      });
    });
  });


  describe('Test Chat.edit', function() {
    var messageid = null;
    // add a new test message
    before(function(done) {
      Chat.remove({}, function(err, result) {
        var message = {
          senderId: mongoose.Types.ObjectId('123456789012'),
          receiverId: mongoose.Types.ObjectId('456789012345'),
          groupId: null,
          message: 'New message'
        };
        Chat.new(message , function(err, addedMessage) {
          (err === null).should.be.true;
          (addedMessage !== null).should.be.true;
          messageid = addedMessage._id;
          addedMessage.edit('Changed message', function(err, result) {
            result.should.be.true;
            done();
          });
        });
      });
    });

    // clear redis and mongodb after done
    after(function(done) {
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
  });
});

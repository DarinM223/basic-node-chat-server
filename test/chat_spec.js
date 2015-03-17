'use strict';

var mongoose = require('mongoose');
if (mongoose.connection.readyState === 0) {
  mongoose.connect('mongodb://localhost:27017/test');
}

var redisClient = require('../redis/redisClient.js')(true); // test client

var should = require('should')
  , Promise = require('bluebird')
  , Chat = Promise.promisifyAll(require('../models/Chat.js'))
  , User = require('../models/User.js')
  , Group = require('../models/Group.js')
  , async = require('async');

redisClient = Promise.promisifyAll(redisClient);

describe('Testing Chat functions', function() {
  describe('Test Chat.new', function() {
    var messageid = null;

    // add a new test message
    before(function(done) {
      redisClient.flushdb();
      Chat.removeAsync({}).then(function() {
        var message = {
          senderId: mongoose.Types.ObjectId('123456789012'),
          receiverId: mongoose.Types.ObjectId('456789012345'),
          groupId: null,
          message: 'New message'
        };

        return Chat.newAsync(message);
      }).then(function(result) {
        (result !== null).should.be.true;
        messageid = result;
        done();
      }).catch(function(e) {
        console.log(e);
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
      Chat.findByIdAsync(messageid).then(function(doc) {
        mongoose.Types.ObjectId(doc.receiverId).equals(mongoose.Types.ObjectId('456789012345')).should.be.true;
        mongoose.Types.ObjectId(doc.senderId).equals(mongoose.Types.ObjectId('123456789012')).should.be.true;
        (doc.groupId === null).should.be.true;
        doc.message.should.equal('New message');
        done();
      }).catch(function(e) {
        console.log(e);
      });
    });

    it('should update receivers unread messages in redis', function(done) {
      redisClient.getAsync('user:unread:' + mongoose.Types.ObjectId('456789012345')).then(function(value) {
        value.should.equal(1);
        done();
      }).catch(function(e) {
        console.log(e);
      });
    });
  });


  describe('Test Chat.edit', function() {
    var messageid = null;

    // add a new test message
    before(function(done) {
      Chat.removeAsync({}).then(function(result) {
        var message = {
          senderId: mongoose.Types.ObjectId('123456789012'),
          receiverId: mongoose.Types.ObjectId('456789012345'),
          groupId: null,
          message: 'New message'
        };

        return Chat.newAsync(message);
      }).then(function(addedMessage) {
        (addedMessage !== null).should.be.true;
        messageid = addedMessage._id;

        var editAsync = Promise.promisify(addedMessage.edit.bind(addedMessage));
        return editAsync('Changed message');
      }).then(function(result) {
        result.should.be.true;
        done();
      }).catch(function(e) {
        console.log(e);
      });
    });

    // clear redis and mongodb after done
    after(function(done) {
      Chat.remove({}, function(err, result) {
        done();
      });
    });

    it('should update the message in mongodb', function(done) {
      Chat.findByIdAsync(messageid).then(function(doc) {
        mongoose.Types.ObjectId(doc.receiverId).equals(mongoose.Types.ObjectId('456789012345')).should.be.true;
        mongoose.Types.ObjectId(doc.senderId).equals(mongoose.Types.ObjectId('123456789012')).should.be.true;
        (doc.groupId === null).should.be.true;
        doc.message.should.equal('Changed message');
        done();
      }).catch(function(e) {
        console.log(e);
      });
    });
  });
});

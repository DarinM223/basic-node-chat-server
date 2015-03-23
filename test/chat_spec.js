'use strict';

var mongoose = require('mongoose');
if (mongoose.connection.readyState === 0) {
  mongoose.connect('mongodb://localhost:27017/test');
}

var redisClient = require('../redis/redisClient.js')(true); // test client

var expect = require('chai').expect
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
        expect(result).to.not.be.a('null');
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
        expect(mongoose.Types.ObjectId(doc.receiverId).equals(mongoose.Types.ObjectId('456789012345'))).to.equal(true);
        expect(mongoose.Types.ObjectId(doc.senderId).equals(mongoose.Types.ObjectId('123456789012'))).to.equal(true);
        expect(doc.groupId).to.be.a('null');
        expect(doc.message).to.equal('New message');
        done();
      }).catch(function(e) {
        console.log(e);
      });
    });

    it('should update receivers unread messages in redis', function(done) {
      redisClient.getAsync('user:unread:' + mongoose.Types.ObjectId('456789012345')).then(function(value) {
        expect(value).to.equal(1);
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
        expect(addedMessage).to.not.be.a('null');
        messageid = addedMessage._id;

        var editAsync = Promise.promisify(addedMessage.edit.bind(addedMessage));
        return editAsync('Changed message');
      }).then(function(result) {
        expect(result).to.equal(true);
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
        expect(mongoose.Types.ObjectId(doc.receiverId).equals(mongoose.Types.ObjectId('456789012345'))).to.equal(true);
        expect(mongoose.Types.ObjectId(doc.senderId).equals(mongoose.Types.ObjectId('123456789012'))).to.equal(true);
        expect(doc.groupId).to.be.a('null');
        expect(doc.message).to.equal('Changed message');
        done();
      }).catch(function(e) {
        console.log(e);
      });
    });
  });
});

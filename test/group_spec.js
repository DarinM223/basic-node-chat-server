'use strict';

var mongoose = require('mongoose');
if (mongoose.connection.readyState === 0) {
  mongoose.connect('mongodb://localhost:27017/test');
}

var expect = require('chai').expect
  , Group = require('../models/Group.js');

describe('Testing Group functions', function() {
  describe('Test Group.exists', function() {
    var groupid = null;
    beforeEach(function(done) {
      Group.remove({}, function(err, result) {
        // add a new group
        var group = new Group({
            createdUser: mongoose.Types.ObjectId('123456789012'),
            name: 'New group',
        });
        group.save(function(err, doc) {
          expect(err).to.be.a('null');
          groupid = doc._id;
          done();
        });
      });
    });
    afterEach(function(done) {
      Group.remove({}, function(err, result) {
        done();
      });
    });

    it('should return true if there is a group', function(done) {
      Group.exists(groupid, function(err, result) {
        expect(result).to.equal(true);
        done();
      });
    });

    it('should return false if there is not a group', function(done) {
      Group.remove({}, function(err, result) {
        Group.exists(groupid, function(err, result) {
          expect(result).to.equal(false);
          done();
        });
      });
    });
  });
});

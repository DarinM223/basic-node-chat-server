'use strict';

var mongoose = require('mongoose');
if (mongoose.connection.readyState === 0) {
  mongoose.connect('mongodb://localhost:27017/test');
}

var expect = require('chai').expect
  , Promise = require('bluebird')
  , User = Promise.promisifyAll(require('../models/User.js'))
  , JoinedUser = require('../models/JoinedUser.js')
  , Group = require('../models/Group.js')
  , async = require('async');

describe('Testing User model', function() {
  beforeEach(function(done) {
    User.collection.remove({}, function(err, result) { done(); });
  });
  afterEach(function(done) {
    User.collection.remove({}, function(err, result) { done(); });
  });

  describe('Test valid insertion', function() {
    it('should properly hash password and insert user', function(done) {
      User.findAsync({}).then(function(docs) {
        expect(docs.length).to.equal(0);
        return User.newAsync('test_user', 'hello');
      }).then(function(success) {
        expect(success).to.equal(true);
        return User.findAsync({});
      }).then(function(docs) {
        expect(docs.length).to.equal(1);
        expect(docs[0].username).to.equal('test_user');
        var comparePasswordAsync = Promise.promisify(docs[0].comparePassword.bind(docs[0]));
        return comparePasswordAsync('hello');
      }).then(function(isPasswordMatch) {
        expect(isPasswordMatch).to.equal(true);
        done();
      }).catch(function(e) {
        console.log(e);
      });
    });
  });

  describe('Test invalid insertion', function() {
    it('should prevent from inserting same username twice', function(done) {
      User.newAsync('test_user', 'hello').then(function(success) {
        expect(success).to.equal(true);
        return User.newAsync('test_user', 'world');
      }).then(function(success) {
        expect(success).to.equal(false);
        done();
      }).catch(function(e) {
        console.log(e);
      });
    });
  });

  describe('Test verification of user that does not exist', function() {
    it('should return false', function(done) {
      User.verify('test_user', 'hello', function(err, user) {
        expect(user).to.be.a('null');
        return done();
      });
    });
  });

  describe('Test entering wrong password for user', function() {
    it('should return false', function(done) {
      User.newAsync('test_user', 'hello').then(function(success) {
        expect(success).to.equal(true);
        return User.verifyAsync('test_user', 'world');
      }).then(function(user) {
        expect(user).to.be.a('null');
        done();
      }).catch(function(e) {
        console.log(e);
      });
    });
  });

  describe('Test valid verification', function() {
    it('should insert user into database and correctly check password', function(done) {
      User.newAsync('test_user', 'hello').then(function(success) {
        expect(success).to.equal(true);
        return User.verifyAsync('test_user', 'hello');
      }).then(function(user) {
        expect(user).to.not.be.a('null');
        done();
      }).catch(function(e) {
        console.log(e);
      });
    });
  });

  describe('Test joining group', function() {
    it('should add new entry to JoinedUser collection', function(done) {
      var myUser = null;
      User.newAsync('test_user', 'hello').then(function(success) {
        expect(success).to.equal(true);
        return User.verifyAsync('test_user', 'hello');
      }).then(function(user) {
        expect(user).to.not.be.a('null');
        myUser = user;
        var joinGroupAsync = Promise.promisify(user.joinGroup.bind(user));
        return joinGroupAsync('123456789012');
      }).then(function() {
        var joinedGroupsAsync = Promise.promisify(myUser.joinedGroups.bind(myUser));
        return joinedGroupsAsync();
      }).then(function(groupids) {
        expect(groupids.length).to.equal(1);
        expect(groupids[0].equals(mongoose.Types.ObjectId('123456789012'))).to.equal(true);
        done();
      }).catch(function(e) {
        console.log(e);
      });
    });
  });

  describe('Test getting created groups', function() {
    it('should return all created group ids', function(done) {
      var myUser = null, group1 = null, group2 = null;
      User.newAsync('test_user', 'hello').then(function(success) {
        expect(success).to.equal(true);
        return User.verifyAsync('test_user', 'hello');
      }).then(function(user) {
        expect(user).to.not.be.a('null');
        myUser = user;
        group1 = new Group({
          createdUser: myUser._id,
          name: 'Group 1'
        });
        var saveAsync = Promise.promisify(group1.save.bind(group1));
        return saveAsync();
      }).then(function() {
        group2 = new Group({
          createdUser: myUser._id,
          name: 'Group 2'
        });
        var saveAsync = Promise.promisify(group2.save.bind(group2));
        return saveAsync();
      }).then(function() {
        var createdGroupsAsync = Promise.promisify(myUser.createdGroups.bind(myUser));
        return createdGroupsAsync();
      }).then(function(groupids) {
        expect(groupids.length).to.equal(2);
        expect(groupids[0].equals(group1._id)).to.equal(true);
        expect(groupids[1].equals(group2._id)).to.equal(true);
        done();
      }).catch(function(e) {
        console.log(e);
      });
    });
  });
});

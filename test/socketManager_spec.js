'use strict'; 

var should = require('should');
var redisClient = require('../redis/redisClient.js')(true);
var socketManager = require('../socketManager.js');

describe('Testing socketManager', function() {
  beforeEach(function(done) {
    socketManager.reset();
    done();
  });
  afterEach(function(done) {
    socketManager.reset();
    done();
  });

  describe('Test addPairing', function() {
    it('should correctly add pairing', function() {
      socketManager.hasUserId('userid').should.equal(false);
      socketManager.hasSocketId('socketid').should.equal(false);
      socketManager.addPairing('socketid', 'userid');
      socketManager.hasUserId('userid').should.equal(true);
      socketManager.hasSocketId('socketid').should.equal(true);
    });

    it('should replace the userid if same socket is added twice', function() {
      socketManager.hasUserId('userid').should.equal(false);
      socketManager.hasUserId('userid2').should.equal(false);
      socketManager.hasSocketId('socketid').should.equal(false);

      socketManager.addPairing('socketid', 'userid');
      socketManager.addPairing('socketid', 'userid2');

      socketManager.hasUserId('userid').should.equal(false);
      socketManager.hasUserId('userid2').should.equal(true);
      socketManager.hasSocketId('socketid').should.equal(true);
    });
    
    it('should do nothing if the same socket with the same userid is added twice', function() {
      socketManager.hasUserId('userid').should.equal(false);
      socketManager.hasUserId('userid2').should.equal(false);
      socketManager.hasSocketId('socketid').should.equal(false);

      socketManager.addPairing('socketid', 'userid');
      socketManager.addPairing('socketid', 'userid');

      socketManager.hasUserId('userid').should.equal(true);
      socketManager.hasSocketId('socketid').should.equal(true);
    });
  });

  describe('Test hasSocketId', function() {
    it('should return true if socketid has a userid and false if socketid doesn\'t have a userid', function() {
      socketManager.hasSocketId('socketid').should.be.false;
      socketManager.addPairing('socketid', 'userid');
      socketManager.hasSocketId('socketid').should.be.true;
    });
  });
  
  describe('Test getSocketId', function() {
    it('should return the correct socketid if userid is valid', function() {
      socketManager.addPairing('socketid', 'userid');
      socketManager.getSocketId('userid').should.equal('socketid');
    });

    it('should return null if there is no userid in the socketManager', function() {
      socketManager.hasUserId('userid').should.equal(false);
      socketManager.hasSocketId('socketid').should.equal(false);
      (socketManager.getSocketId('userid') === null).should.be.true;
    });
  });
  
  describe('Test getUserId', function() {
    it('should return the correct userid if socketid is valid', function() {
      socketManager.addPairing('socketid', 'userid');
      socketManager.getUserId('socketid').should.equal('userid');
    });

    it('should return null if there is no socketid in the socketManager', function() {
      (socketManager.getUserId('socketid') === null).should.be.true;
    });
  });
  
  describe('Test removePairing', function() {
    it('should correctly remove a socketid to userid pair', function() {
      socketManager.addPairing('socketid', 'userid');
      socketManager.hasUserId('userid').should.equal(true);
      socketManager.hasSocketId('socketid').should.equal(true);
      socketManager.removePairing('socketid');
      socketManager.hasUserId('userid').should.equal(false);
      socketManager.hasSocketId('socketid').should.equal(false);
    });
  });
});

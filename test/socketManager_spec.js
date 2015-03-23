'use strict'; 

var expect = require('chai').expect
  , redisClient = require('../redis/redisClient.js')(true)
  , SocketManager = require('../SocketManager.js')
  , socketManager = new SocketManager();

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
      expect(socketManager.hasUserId('userid')).to.equal(false);
      expect(socketManager.hasSocketId('socketid')).to.equal(false);
      socketManager.addPairing('socketid', 'userid');
      expect(socketManager.hasUserId('userid')).to.equal(true);
      expect(socketManager.hasSocketId('socketid')).to.equal(true);
    });

    it('should replace the userid if same socket is added twice', function() {
      expect(socketManager.hasUserId('userid')).to.equal(false);
      expect(socketManager.hasUserId('userid2')).to.equal(false);
      expect(socketManager.hasSocketId('socketid')).to.equal(false);

      socketManager.addPairing('socketid', 'userid');
      socketManager.addPairing('socketid', 'userid2');

      expect(socketManager.hasUserId('userid')).to.equal(false);
      expect(socketManager.hasUserId('userid2')).to.equal(true);
      expect(socketManager.hasSocketId('socketid')).to.equal(true);
    });
    
    it('should do nothing if the same socket with the same userid is added twice', function() {
      expect(socketManager.hasUserId('userid')).to.equal(false);
      expect(socketManager.hasUserId('userid2')).to.equal(false);
      expect(socketManager.hasSocketId('socketid')).to.equal(false);

      socketManager.addPairing('socketid', 'userid');
      socketManager.addPairing('socketid', 'userid');

      expect(socketManager.hasUserId('userid')).to.equal(true);
      expect(socketManager.hasSocketId('socketid')).to.equal(true);
    });
  });

  describe('Test hasSocketId', function() {
    it('should return true if socketid has a userid and false if socketid doesn\'t have a userid', function() {
      expect(socketManager.hasSocketId('socketid')).to.equal(false);
      socketManager.addPairing('socketid', 'userid');
      expect(socketManager.hasSocketId('socketid')).to.equal(true);
    });
  });
  
  describe('Test getSocketId', function() {
    it('should return the correct socketid if userid is valid', function() {
      socketManager.addPairing('socketid', 'userid');
      expect(socketManager.getSocketId('userid')).to.equal('socketid');
    });

    it('should return null if there is no userid in the socketManager', function() {
      expect(socketManager.hasUserId('userid')).to.equal(false);
      expect(socketManager.hasSocketId('socketid')).to.equal(false);
      expect(socketManager.getSocketId('userid') === null).to.equal(true);
    });
  });
  
  describe('Test getUserId', function() {
    it('should return the correct userid if socketid is valid', function() {
      socketManager.addPairing('socketid', 'userid');
      expect(socketManager.getUserId('socketid')).to.equal('userid');
    });

    it('should return null if there is no socketid in the socketManager', function() {
      expect(socketManager.getUserId('socketid')).to.be.a('null');
    });
  });
  
  describe('Test removePairing', function() {
    it('should correctly remove a socketid to userid pair', function() {
      socketManager.addPairing('socketid', 'userid');
      expect(socketManager.hasUserId('userid')).to.equal(true);
      expect(socketManager.hasSocketId('socketid')).to.equal(true);
      socketManager.removePairing('socketid');
      expect(socketManager.hasUserId('userid')).to.equal(false);
      expect(socketManager.hasSocketId('socketid')).to.equal(false);
    });
  });
});

'use strict';

var should = require('should')
  , encryption = require('../encryption.js');

describe('Encryption testing', function () {
  describe('Test encrypting and decrypting', function() {
    it('should properly hash password', function(done) {
      encryption.cryptPassword('testpassword', function(err, result) {
        result.should.not.equal('testpassword');
        encryption.comparePassword('testpassword', result, function(err, answer) {
          answer.should.equal(true);
          return done();
        });
      });
    });
  });
});

'use strict';

var expect = require('chai').expect
  , encryption = require('../encryption.js');

describe('Encryption testing', function () {
  describe('Test encrypting and decrypting', function() {
    it('should properly hash password', function(done) {
      encryption.cryptPassword('testpassword', function(err, result) {
        expect(result).to.not.equal('testpassword');
        encryption.comparePassword('testpassword', result, function(err, answer) {
          expect(answer).to.equal(true);
          return done();
        });
      });
    });
  });
});

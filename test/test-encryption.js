'use strict';

var should = require('should');
var encryption = require('../encryption.js');

describe('Encryption testing', function () {
  it('Test encrypting and decrypting', function(done) {
    encryption.cryptPassword('testpassword', function(err, result) {
      result.should.not.equal('testpassword');
      encryption.comparePassword('testpassword', result, function(err, answer) {
        answer.should.equal(true);
        done();
      });
    });
  });
});

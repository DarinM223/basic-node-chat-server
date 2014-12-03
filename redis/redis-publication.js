'use strict';

var redis = require('redis');

var redisPubClient = redis.createClient();

redisPubClient.addGroupMessage = function(senderid, message) {
  var pub = this;

};

redisPubClient.addIndividualMessage = function(senderid, message) {
  var pub = this;

  pub.get('login:' + senderid, function(err, value) {
    if (err) {
      console.log(err);
      return false;
    } 
    /*
     * TODO: add message to mongodb and redis add number of unread messages to mongo and redis
     */
    if (value != null) { // if logged in 
    }

    return true;
  });
};

redisPubClient.editGroupMessage = function(groupid, messageid) {
  var pub = this;
  /*
   * TODO: check if messageid is in the group's messages, if it is, then send editIndividualMessage to all members of the group
   */
};

redisPubClient.editIndividualMessage = function(receiverid, messageid) {
  var pub = this;
  /*
   * TODO: edit the message in both redis and mongodb (mongo first, then redis if it succeeds)
   */
};

module.exports = redisPubClient;

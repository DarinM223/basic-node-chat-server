'use strict'; 

/*
 * Stores the sockets for a single server.
 */

var sockid_to_userid = {};
var userid_to_sockid = {};

exports.addPairing = function(socketid, userid) {
  // if the socket is already taken with a different user replace the user
  if (sockid_to_userid[socketid] !== null && sockid_to_userid[socketid] !== userid) {
    var oldUserId = sockid_to_userid[socketid];
    sockid_to_userid[socketid] = userid; 
    userid_to_sockid[userid] = socketid;
    userid_to_sockid[oldUserId] = null;
  } else if (sockid_to_userid[socketid] !== null) {
    // do nothing if the socket is already taken and the userids are the same
  } else {
    sockid_to_userid[socketid] = userid;
    userid_to_sockid[userid] = socketid;
  }
};

exports.hasUserId = function(userid) {
  if (userid in userid_to_sockid && userid_to_sockid[userid] !== null) {
    return true;
  } else {
    return false;
  }
};

exports.getSocketId = function(userid) {
  if (userid in userid_to_sockid && userid_to_sockid[userid] !== null) {
    return userid_to_sockid[userid];
  } else {
    return null;
  }
};

exports.hasSocketId = function(socketid) {
  if (socketid in sockid_to_userid && sockid_to_userid[socketid] !== null) {
    return true;
  } else {
    return false;
  }
};

exports.getUserId = function(socketid) {
  if (socketid in sockid_to_userid && sockid_to_userid[socketid] !== null) {
    return sockid_to_userid[socketid];
  } else {
    return null;
  }
};

exports.removePairing = function(socketid) {
  var userid = sockid_to_userid[socketid];
  sockid_to_userid[socketid] = null;
  userid_to_sockid[userid] = null;
};

exports.reset = function() {
  sockid_to_userid = {};
  userid_to_sockid = {};
};

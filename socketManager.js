'use strict'; 

/*
 * TODO: store the actual socket instead of just the id so that you can send from the socket
 */

/*
 * Stores the sockets for a single server.
 */

var sockid_to_userid = {};
var userid_to_sockid = {};

exports.addPairing = function(socketid, userid) {
  sockid_to_userid[socketid] = userid;
  userid_to_sockid[userid] = socketid;
};

exports.hasUserId = function(userid) {
  if (userid in userid_to_sockid && userid_to_sockid[userid] != null) {
    return true;
  } else {
    return false;
  }
};

exports.getSocketId = function(userid) {
  if (userid in userid_to_sockid && userid_to_sockid[userid] != null) {
    return userid_to_sockid[userid];
  } else {
    return null;
  }
};

exports.hasSocketId = function(socketid) {
  if (socketid in sockid_to_userid && sockid_to_userid[socketid] != null) {
    return true;
  } else {
    return false;
  }
};

exports.getUserId = function(socketid) {
  if (socketid in sockid_to_userid && sockid_to_userid[socketid] != null) {
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

'use strict'; 

/*
 * Stores the currently connected sockets for a single server.
 */

var sockid_to_userid = {};
var userid_to_sockid = {};

/**
 * Adds a new socket-id/user-id key/value pair
 * @param {string} socketid the id of the currently connected socket
 * @param {string} userid the user id of the user logged in with the socket
 */
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

/**
 * Checks if the user already has a socket
 * @param {string} userid
 * @return {boolean}
 */
exports.hasUserId = function(userid) {
  if (userid in userid_to_sockid && userid_to_sockid[userid] !== null) {
    return true;
  } else {
    return false;
  }
};

/**
 * Retrieves the socketid of a logged in user through the userid
 * @param {string} userid
 * @return {string} the socketid for the user
 */
exports.getSocketId = function(userid) {
  if (userid in userid_to_sockid && userid_to_sockid[userid] !== null) {
    return userid_to_sockid[userid];
  } else {
    return null;
  }
};

/**
 * Checks if the socket already has a user
 * @param {string} socketid
 * @return {boolean}
 */
exports.hasSocketId = function(socketid) {
  if (socketid in sockid_to_userid && sockid_to_userid[socketid] !== null) {
    return true;
  } else {
    return false;
  }
};

/**
 * Retrieves the userid of a logged in user from the socketid
 * @param {string} socketid
 * @return {string} the userid for the socket
 */
exports.getUserId = function(socketid) {
  if (socketid in sockid_to_userid && sockid_to_userid[socketid] !== null) {
    return sockid_to_userid[socketid];
  } else {
    return null;
  }
};

/**
 * Removes a socketid/userid key/value pair
 * @param {string} socketid
 */
exports.removePairing = function(socketid) {
  var userid = sockid_to_userid[socketid];
  sockid_to_userid[socketid] = null;
  userid_to_sockid[userid] = null;
};

/**
 * Clears all of the socket/userid key/value pairs
 *
 * (Only for testing)
 */
exports.reset = function() {
  sockid_to_userid = {};
  userid_to_sockid = {};
};

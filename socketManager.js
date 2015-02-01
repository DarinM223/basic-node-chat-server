'use strict'; 

/*
 * Stores the currently connected sockets for a single server.
 */

function SocketManager() {
  this.sockid_to_userid = {};
  this.userid_to_sockid = {};
}

/**
 * Adds a new socket-id/user-id key/value pair
 * @param {string} socketid the id of the currently connected socket
 * @param {string} userid the user id of the user logged in with the socket
 */
SocketManager.prototype.addPairing = function(socketid, userid) {
  // if the socket is already taken with a different user replace the user
  if (this.sockid_to_userid[socketid] !== null && this.sockid_to_userid[socketid] !== userid) {
    var oldUserId = this.sockid_to_userid[socketid];
    this.sockid_to_userid[socketid] = userid; 
    this.userid_to_sockid[userid] = socketid;
    this.userid_to_sockid[oldUserId] = null;
  } else if (this.sockid_to_userid[socketid] !== null) {
    // do nothing if the socket is already taken and the userids are the same
  } else {
    this.sockid_to_userid[socketid] = userid;
    this.userid_to_sockid[userid] = socketid;
  }
};

/**
 * Checks if the user already has a socket
 * @param {string} userid
 * @return {boolean}
 */
SocketManager.prototype.hasUserId = function(userid) {
  if (userid in this.userid_to_sockid && this.userid_to_sockid[userid] !== null) {
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
SocketManager.prototype.getSocketId = function(userid) {
  if (userid in this.userid_to_sockid && this.userid_to_sockid[userid] !== null) {
    return this.userid_to_sockid[userid];
  } else {
    return null;
  }
};

/**
 * Checks if the socket already has a user
 * @param {string} socketid
 * @return {boolean}
 */
SocketManager.prototype.hasSocketId = function(socketid) {
  if (socketid in this.sockid_to_userid && this.sockid_to_userid[socketid] !== null) {
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
SocketManager.prototype.getUserId = function(socketid) {
  if (socketid in this.sockid_to_userid && this.sockid_to_userid[socketid] !== null) {
    return this.sockid_to_userid[socketid];
  } else {
    return null;
  }
};

/**
 * Removes a socketid/userid key/value pair
 * @param {string} socketid
 */
SocketManager.prototype.removePairing = function(socketid) {
  var userid = this.sockid_to_userid[socketid];
  this.sockid_to_userid[socketid] = null;
  this.userid_to_sockid[userid] = null;
};

/**
 * Clears all of the socket/userid key/value pairs
 *
 * (Only for testing)
 */
SocketManager.prototype.reset = function() {
  this.sockid_to_userid = {};
  this.userid_to_sockid = {};
};

module.exports = function() {
  return new SocketManager;
};

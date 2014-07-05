'use strict';
var messageList = [];
var userList = [];
var fadeOutList = [];
var assignId = 0;
var my_username = null;
var sendChat;


window.onload = function () {
  var socket = io.connect('http://localhost:3700');

  // login controls
  var loginUsername = document.getElementById('loginUsername');
  var loginPassword = document.getElementById('loginPassword');
  var loginButton = document.getElementById('loginButton');
  var loggedin = document.getElementById('loggedin');

  // signup controls
  var signupUsername = document.getElementById('signupUsername');
  var signupPassword = document.getElementById('signupPassword');
  var signupPasswordReenter = document.getElementById('signupPasswordReenter');
  var signupButton = document.getElementById('signupButton');
  var warningMessage = document.getElementById('warningMessage');
  warningMessage.innerHTML = "";

  // chat controls
  var chatbox = document.getElementById('chatbox');
  var user_list = document.getElementById('userList');
  var chatField = document.getElementById('chatField');
  var sendButton = document.getElementById('sendButton');

  // grab list of active users when first loading
  socket.emit('list');

  function getLabelText(str, my_str) {
    if (!my_str) {
      return "default";
    } 
    if (str === my_str) {
      return "success";
    } 
    return "primary";
  }

  function reload_message_list() {
    // generate the html for all of the messages in the list
    // TODO: Clean up this mess!!
    var html = '';
    for (var i = messageList.length - 1; i >= 0; i--) {
      var myAssignId = (messageList[i].assignId ? messageList[i].assignId : assignId);
      var username_test = messageList[i].username === my_username;
      if (messageList[i].receiver) {
        // private message
        var receiver_test = messageList[i].receiver === my_username;
        var username_label_text = getLabelText(messageList[i].username, my_username);
        var receiver_label_text = getLabelText(messageList[i].receiver, my_username);
        html += '<div class="alert alert-dismissable alert-info fade in" id="';
        html += myAssignId + '">';
        html += '<button type="button" class="close" data-dismiss="alert">x</button>';
        html += '<span class="label label-' + username_label_text + '">' + (username_test ? "You" : messageList[i].username) + '</span> ';
        html += '<span class="label label-' + receiver_label_text + '">' + (receiver_test ? "You" : messageList[i].receiver)  + '</span> '; 
        html += messageList[i].message;
        html += '</div>';
      } else if (messageList[i].username) {
        // public message
        var label_text = getLabelText(messageList[i].username, my_username);
        html += '<div class="alert alert-dismissable alert-success fade in" id="';
        html += myAssignId + '">';
        html += '<button type="button" class="close fade in" data-dismiss="alert">x</button>';
        html += '<span class="label label-' + label_text + '">' + (username_test ? "You" : messageList[i].username) + '</span> ';
        html += messageList[i].message;
        html += '</div>';
      } else {
        // server message
        if (messageList[i].error) {
          html += '<div class="alert alert-dismissable alert-danger fade in" id="';
        } else {
          html += '<div class="alert alert-dismissable alert-warning fade in" id="';
        }
        html += myAssignId + '">';
        html += '<button type="button" class="close" data-dismiss="alert">x</button>';
        html += '<span class="label label-default" >' + "Server" + '</span> ';
        html += (messageList[i].error ? messageList[i].error : messageList[i].message);
        html += '</div>';
        // add server messages to the fade out list
        if (!messageList[i].assignId) {
          fadeOutList.push({
                  'id': assignId,
                  'time': (new Date().getTime())
          });
        }
      }
      // assign new id for messages that don't already have one
      if (!messageList[i].assignId) {
        messageList[i].assignId = assignId;
        assignId++;
      }
    }
    // set the list's HTML to show all of the messages
    chatbox.innerHTML = html;
  }

  function reload_user_list() {
    var html = '';
    for (var i = 0; i < userList.length; i++) {
      if (userList[i] !== my_username) { 
        html += '<a href="#" class="list-group-item user_list">' + userList[i] + '</a>';
      }
    }
    if (my_username) {
      loggedin.innerHTML = "Logged in as " + my_username;
    }
    user_list.innerHTML = html;

    var elements = document.getElementsByClassName('user_list');
    for (var i = 0; i < elements.length; i++) {
      elements[i].onclick = function () {
        if (this.innerHTML !== my_username) {
          this.classList.toggle('active');
        }
      };
    }
  }

  // automatically fade server messages every two seconds
  setInterval(function () {
    if (fadeOutList.length > 0) {
      (function (data) {
        var id = data.id;
        // only fade elements that have at least one second of elapsed time (so elements don't
        // disappear immediately after being shown)
        if (((new Date().getTime()) - data.time) > 1000) {
          for (var i = 0; i < fadeOutList.length; i++) {
            if (id === fadeOutList[i].id) {
              fadeOutList.splice(i, 1);
            }
          }
          $('#'+ id).fadeOut("slow", function () {
            // after fading out, remove the message
            // TODO: use more efficient way of finding message with id
            for (var i = 0; i < messageList.length; i++) {
              if (messageList[i].assignId && id === messageList[i].assignId) {
                  messageList.splice(i, 1);
              }
            }
            reload_message_list();
          });
        }
      }) (fadeOutList[0]);
    }
  }, 2000);

  /*
   * Sends message to chat
   * attributes: 
   * error: if the data is an error message
   * message: for normal chat messages
   */
  function sendMessage(data) {
    if (data.message || data.error) {
      // add the message to the list
      messageList.push(data);
      reload_message_list();
    } else {
      console.log("There is a problem: ", data);
    }
  }

  function clearDialogFields() {
    loginUsername.value = "";
    loginPassword.value = "";
    signupUsername.value = "";
    signupPassword.value = "";
    signupPasswordReenter.value = "";
  }

  // if a socket receives a message
  socket.on ('message', function (data) {
    sendMessage(data);
  });

  socket.on('login-response', function (data) {
    if (data.error) {
      // TODO: instead of sending message to chat, show error message in login dialog
      sendMessage(data);
    } else if (data.username) {
      my_username = data.username;
    }
  });

  // if a new client has logged in (broadcasted to all clients)
  socket.on ('userlogin', function (data) {
    socket.emit('list');
    var messageData = {};
    messageData.message = data.username + " has connected to the server";
    sendMessage(messageData);
  });

  // if a new client has logged out (broadcasted to all clients)
  socket.on('userlogout', function (data) {
    socket.emit('list');
    var messageData = {};
    messageData.message = data.username + " has disconnected from the server";
    sendMessage(messageData);
  });

  // a list of users received when a client requests it
  socket.on('list', function (data) {
    // clear user list
    while (userList.length > 0) {
      userList.pop();
    }
    // push load usernames in list into user list
    for (var index = 0; index < data.list.length; index++) {
      userList.push(data.list[index]);
    }
    reload_user_list();
  });

  // whenever chat message is sent
  sendButton.onclick = sendChat = function () {
    var text = chatField.value;
    var elements = document.getElementsByClassName('user_list');
    var privateSent = false;
    // send private message to all selected users
    for (var i = 0; i < elements.length; i++) {
      if (elements[i].classList.contains('active')) {
        socket.emit('send-private', { message: text, username: my_username, receiver: elements[i].innerHTML });
        privateSent = true;
      }
    }
    // if no users selected, send public message
    if (!privateSent) {
      socket.emit('send', { message: text, username: my_username });
    }
    chatField.value = "";
  };


  // Whenever login button is clicked, emit 'login' request
  loginButton.onclick = function () {
    var usernameText = loginUsername.value;
    var passwordText = loginPassword.value;
    socket.emit('login', { username: usernameText, password: passwordText });
    clearDialogFields();
  };

  // Whenever signup button is clicked, emit 'signup' request
  signupButton.onclick = function () {
    var usernameText = signupUsername.value;
    var passwordText = signupPassword.value;
    var reenterPassword = signupPasswordReenter.value;
    if (usernameText === "") {
      warningMessage.innerHTML = "Please enter a username";
    } else if (passwordText === reenterPassword) {
      socket.emit('signup', { username: usernameText, password: passwordText });
      socket.on('signup-response', function (data) {
        if (!data.error) {
          socket.emit('login', { username: usernameText, password: passwordText });
          $('#modalSignup').modal('hide');
        } else {
          warningMessage.innerHTML = data.error;
        }
      });
    } else {
      warningMessage.innerHTML = "The two password fields are not the same";
    }
    clearDialogFields();
  };

};

// send chat message when enter key pressed inside input field
$(document).ready(function () {
  $("#chatField").keyup(function (e) {
    if (e.keyCode === 13) {
      sendChat();
    }
  });
});

// when chat message close button clicked, remove message
$(document).on('click', '.close', function (event) {
  var pid = parseInt($(event.target).parent().attr('id'), 10);
  console.log(pid);
  // TODO: Use more efficient way of finding message id
  for (var i = 0; i < messageList.length; i++) {
    if (messageList[i].assignId && pid === messageList[i].assignId) {
      messageList.splice(i, 1);
    }
  }
});

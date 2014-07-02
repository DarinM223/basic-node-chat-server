var express = require('express');
var app = express();
var async = require('async');

// include database functions
var _database = require('./database.js');

var database = new _database('localhost:27017/mydb', 'users');

// so you can find current username using the socket
var sockid_to_username = {};

// temporarily save last 20 public messages so when new user connects they can see them
function messageStore() {
    this.pastMessages = [];
}
messageStore.prototype.add_message = function (message) {
    // remove oldest messages first
    while (this.pastMessages.length + 1 > 20) {
        this.pastMessages.shift();
    }
    this.pastMessages.push(message);
}

var messages = new messageStore();

//you need this to parse requests!!!!!
//app.use(express.json()); //this doesn't work!!!
//app.use(express.urlencoded()); //this doesn't work either!!!

// have to manually include body parser
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded());

// set the views directory to the tpl directory that we made
app.set('views', __dirname + '/tpl');

// set the jade engine
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);

// set up server that renders the page when a request is made
app.get("/", function (req, res) {
    res.render("chat");
});

// display the form to add new user
app.get("/newuser", function (req, res) {
    res.render('newuser', { title: 'Add new User' });
});

// handle the add user post request
app.post('/adduser', function (req, res) {
    // req.body instead of req.query in express 3.0
    var userName = req.body.username;
    // should be encrypted 
    var userPwd = req.body.password;

    if (userName == null || userPwd == null) {
        res.send("Username or password is empty");
    }

    // check if username is already taken
    database.get_user_count(userName, null, function (err, count) {
        if (err) {
            console.log("There was an error accessing the database!");
        } else if (count <= 0) {
            database.insert_user(userName, userPwd, function (err, doc) {
                if (err) 
                    res.send("There was a problem adding the information to the database");
                else {
                    res.location("/");
                    res.redirect("/");
                }
            });
        } else {
            res.send("There is already an account with this username");
        }
    });
});

// tell express to find where the public files needed for the html pages are
app.use(express.static(__dirname + '/public'));

// use socket integration
var port = 3700;
var io = require('socket.io').listen(app.listen(port));

// uses a test database for debugging
exports.setDebugging = function () {
    database = new _database('localhost:27017/test', 'users');
}

console.log("Listening on port " + port);

// socket passed in function (socket) is the client's socket
io.sockets.on('connection', function (socket) {
        socket.emit('message', { message: 'Hello, please login to chat'});
        for (var i = 0; i < messages.pastMessages.length; i++) {
            socket.emit('message', messages.pastMessages[i]);
        }
        // if it receives a login request, check database for existing users
        socket.on('login', function (data) {
            var already_registered = false;
            for (var key in sockid_to_username) {
                // if the username that you want is already in a socket
                if (sockid_to_username[key] === data.username) {
                    already_registered = true;
                }
            }
            if (already_registered) {
                socket.emit('login-response', { error: 'You have already logged in' });
            } else {
                // TODO: Use async.waterfall for nested callback
                database.get_user_count(data.username, data.password, function (err, count) {
                    if (err) {
                        console.log("There was an error accessing the database!");
                    } else if (count > 0) {
                        socket.join('registered');
                        sockid_to_username[socket.id] = data.username;
                        socket.emit('login-response', { response: 'OK' });
                        io.sockets.emit('userlogin', { username: data.username });
                    } else {
                        database.get_user_count(data.username, null, function (err, count) {
                            if (count && count > 0) {
                                socket.emit('login-response', { error: 'Your username or password was incorrect' });
                            } else {
                                socket.emit('login-response', { error: "You haven't signed up yet" });
                            }
                        });
                    }
                });
            }
        });

        socket.on('signup', function (data) {
            var userName = data.username;
            var userPwd = data.password;

            if (userName == null || userPwd == null) {
                socket.emit('signup-response', { error: "Username or password is empty" });
            } else if (userName.trim() === "" || userPwd.trim() === "") {
                socket.emit('signup-response', { error: "Username or password is empty" });
            } else {
                // TODO: Use async.waterfall for nested callback
                // check if username is already taken
                database.get_user_count(userName, null, function (err, count) {
                    if (err) {
                        console.log("There was an error accessing the database!");
                    } else if (count <= 0) {
                        database.insert_user(userName, userPwd, function (err, doc) {
                            if (err) {
                                socket.emit('signup-response', { error: "There was a problem adding the information to the database" } );
                            } else {
                                socket.emit('signup-response', { response: "OK" });
                            }
                        });
                    } else {
                        socket.emit('signup-response', { error: "There is already an account with this username" });
                    }
                });
            }
        });

        // send list of users when requested
        socket.on('list', function (data) {
            var username_list = [];
            for (var key in sockid_to_username) {
                if (sockid_to_username[key])
                    username_list.push(sockid_to_username[key]);
            }
            socket.emit('list', { list: username_list });
        });
        
        // when client sends data, emit data to other clients
        socket.on('send', function (data) {
            //if the socket is registered, send the message
            if (sockid_to_username[socket.id] != null) {
                io.sockets.emit('message', data);
                messages.add_message(data);
            } else {
                socket.emit('message', { error: 'You have to login before chatting' });
            }
        });

        // when client wants to send private message, find the client where it has to be sent
        socket.on('send-private', function (data) {
            if (sockid_to_username[socket.id] != null) {
                var sent_message = false;
                for (var key in sockid_to_username) {
                    // if socket id's mapped username matches the client to receive the message
                    if (sockid_to_username[key] === data.receiver) {
                        // send to that socket and your socket
                        socket.to(key).emit('message', data);
                        socket.emit('message', data);
                        sent_message = true;
                    }
                }
                if (!sent_message)
                   socket.emit('message', { error: 'User is either not online or does not exist' });
            } else {
                socket.emit('message', { error: 'You have to login before chatting' });
            }
        });

        socket.on('disconnect', function () {
            // emit disconnected message
            if (sockid_to_username[socket.id] != null) {
                var disconnected_uname = sockid_to_username[socket.id];
                sockid_to_username[socket.id] = null;
                io.sockets.emit('userlogout', { username: disconnected_uname });
            }
        });
});



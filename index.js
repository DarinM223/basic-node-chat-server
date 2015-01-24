/* @flow */
'use strict';

var express = require('express')
  , app = express()
  , async = require('async')
  , mongoose = require('mongoose')
  , passport = require('passport');

var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(passport.initialize());

// app.use(session({ secret: 'kakka carrot cake', cookie: { maxAge: 60000 }}));
// app.use(flash());

// set the views directory to the tpl directory that we made
app.set('views', __dirname + '/tpl');

// set the jade engine
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);

var users = require('./routes/users.js');
var index = require('./routes/index.js');

app.use('/users', users);
app.use('/', index);

// tell express to find where the public files needed for the html pages are
app.use(express.static(__dirname + '/public'));

// use socket integration
var port = 3700;

// connect to main database
mongoose.connect('mongodb://localhost:27017/mydb');

// start sockets server
var server = app.listen(3000, function() {
  console.log('Server started at port 3000');
});
var socketServer = require('./socketServer.js')(server);

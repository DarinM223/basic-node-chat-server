'use strict';

var express = require('express');
var app = express();
var async = require('async');
var mongoose = require('mongoose');

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
app.get('/', function (req, res) {
  res.render('index');
});

// tell express to find where the public files needed for the html pages are
app.use(express.static(__dirname + '/public'));

// use socket integration
var port = 3700;

// connect to main database
mongoose.connect('mongodb://localhost:27017/mydb');

// start sockets server
var sockets = require('./sockets.js')(app, port);

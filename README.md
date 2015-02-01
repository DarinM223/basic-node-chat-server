Socket.io chat server
=====================

![Main Image](http://i.imgur.com/VtAYjFC.png)

A distributed chat server that supports groups. It consists of both a backend REST api with endpoints
for CRUD operations for users and groups, and socket.io endpoints for sending and receiving messages.

Because it uses redis pub/sub functionality to listen for incoming messages, it could scale to multiple servers if used with a load balancer. Each server only stores a portion of the total number of connected sockets and when that socket receives a message, it publishes the message to the redis channel and each server looks at the message and checks if they hold the socket that receives the message.

Although this project has unit tests, the front end application hasn't been written (if you want to see a fully working chat application check out the old-version branch) 

TODO:
 * Make front end application
 * Add edit message functionality
 * Add group/user search
 * Refactoring/fixing bugs
 * Add more tests

Installation
------------

###Requirements: mongodb, redis

###Tested on: OS X Yosemite, Ubuntu 14.04

After you clone the repository, you need to install all of the dependencies first

(in directory of the cloned repository)

    npm install

Before you can run the chat server you must first run the redis server:

    redis-server

Then to run the chat server:

    node index.js

There are other options to run the server. If you run the server using the
**supervisor** plugin you won't need to restart the server whenever you make changes
to the node javascript files. To do that enter:

    For Ubuntu:
    npm start
    For Windows:
    node_modules\.bin\supervisor index.js

Testing
-------

To run all of the unit tests, enter:

    For Ubuntu:
    npm test
    For Windows:
    node_modules\.bin\mocha

Make sure that Mongodb is running before running the tests, since they need a sample
database to test login/signup functionality.

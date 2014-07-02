Basic chat client/server using Socket.io
========================================

![Main Image](http://i.imgur.com/exhA9UP.png)

This is my first project using Node.js and Socket.io

Basic Functionality
-------------------
Chat messages are shown in the list on the left and the most recent
message is at the top. The labels on the private messages use the format

**[sender of message] [receiver of message] message**

Logged in users other than yourself are shown in the list on the right.
Clicking on a user and then sending a message will send a private message
to that user only. You can select multiple users to send a message to.

Installation
------------

###Requirements: mongodb

###Tested on: Ubuntu 12.04, Ubuntu 14.04

After you clone the repository, you need to install all of the dependencies first

(in directory of the cloned repository)

    npm install

Finally, to run the chat server:

    npm start

Then open the browser and enter http://localhost:3700/

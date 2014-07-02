//Database setup
var mongo = require('mongodb');
var monk = require('monk');
var database = function(connection_url, user_collection_name) {
    //var db = monk('localhost:27017/mydb');
    var db = monk(connection_url);
    this.user_collection = db.get(user_collection_name);
};

// gets number of users with the username/password in the database
database.prototype.get_user_count = function(username, encrypted_password, callback) {
    // TODO: unencrypt password
    var password = encrypted_password;
    if (password) {
        this.user_collection.find({
                "username": username,
                "password": password
        }, function (err, docs) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, docs.length);
            }
        });
    } else {
        this.user_collection.find({
                "username": username
        }, function (err, docs) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, docs.length);
            }
        });
    }
}

// inserts user in database
database.prototype.insert_user = function (username, encrypted_password, callback) {
    // TODO: unencrypt password
    var password = encrypted_password;
    this.user_collection.insert({
            "username": username,
            "password": password
    }, function (err, doc) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, doc);
        }
    });
}

module.exports = database;

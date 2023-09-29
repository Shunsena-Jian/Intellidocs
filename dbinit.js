let client;
var db;
var users;
var files;
var notifications;
var privileges;

const MongoClient = require('mongodb').MongoClient;



// Database initialization
function initializeDatabaseConnection(url,dbName){
    try{
        client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
        client.connect();
        db = client.db(dbName);
        console.log("Connected to the Database.");
        return db;
    } catch(error) {
        console.log("Failed to connect to the Database! ");
        console.log(error);
        process.exit(0);
    }
}

// Users collection initialization
function initializeUsersCollectionConnection(){
    try{
        users = db.collection('users');
        console.log("Connected to the Database Users Collection.");
        return users;
    }catch(error){
        console.log(error);
    }
}

// Files collection initialization
function initializeFilesCollectionConnection(){
    try{
        files = db.collection('files');
        console.log("Connected to the Database Files Collection.");
        return files;
    }catch(error){
        console.log(error);
    }
}

// Notifications collection initialization
function initializeNotificationsCollectionConnection(){
    try{
        notifications = db.collection('notifications');
        console.log("Connected to the Database Notifications Collection.");
        return notifications;
    }catch(error){
        console.log(error);
    }
}

// Privileges collection initialization
function initializePrivilegesCollectionConnection(dbc){
    try{
        privileges = dbc.collection('privileges');
        console.log("Connected to the Database Privileges Collection.");
        return privileges;
    }catch(error){
        console.log(error);
    }
}

module.exports = {
    MongoClient,
    initializeDatabaseConnection,
    initializeFilesCollectionConnection,
    initializePrivilegesCollectionConnection,
    initializeUsersCollectionConnection,
    initializeNotificationsCollectionConnection
};
const MongoClient = require('mongodb').MongoClient;

// Database initialization
function initializeDatabaseConnection(url,dbName){
    var db;
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

function initializePicturesCollectionConnection(db){
    var pictures;
    try{
        pictures = db.collection('pictures');
        console.log("Connected to the Database Pictures Collection.");
        return pictures;
    } catch(error){
        console.log(error);
    }
}

function initializeFormsCollectionConnection(db){
    var forms;
    try{
        forms = db.collection('forms');
        console.log("Connected to the Database Forms Collection.");
        return forms;
    } catch(error){
        console.log(error);
    }
}

// Users collection initialization
function initializeUsersCollectionConnection(db){
    var users;
    try{
        users = db.collection('users');
        console.log("Connected to the Database Users Collection.");
        return users;
    }catch(error){
        console.log(error);
    }
}

// Files collection initialization
function initializeFilesCollectionConnection(db){
    var files;
    try{
        files = db.collection('files');
        console.log("Connected to the Database Files Collection.");
        return files;
    }catch(error){
        console.log(error);
    }
}

// Notifications collection initialization
function initializeNotificationsCollectionConnection(db){
    var notifications;
    try{
        notifications = db.collection('notifications');
        console.log("Connected to the Database Notifications Collection.");
        return notifications;
    }catch(error){
        console.log(error);
    }
}

// Privileges collection initialization
function initializePrivilegesCollectionConnection(db){
    var privileges;
    try{
        privileges = db.collection('privileges');
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
    initializeNotificationsCollectionConnection,
    initializeFormsCollectionConnection,
    initializePicturesCollectionConnection
};
const express = require('express');
const session = require('express-session');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const multer = require('multer');
const fs = require('fs');
const port = 3000;
let client;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use('/views/src', express.static(path.join(__dirname, 'views', 'src')));
app.use(express.static(path.join(__dirname, 'views')));
app.use('/uploads', express.static('uploads'));

// Define the database
const url = 'mongodb://127.0.0.1/intellijent';
const dbName = 'intellijent';

var db;
var users;
var files;
var privileges;

initializeDatabaseConnection(url,dbName);
initializeUsersCollectionConnection();
initializeFilesCollectionConnection();
initializePrivilegesCollectionConnection();

app.use(session({
  secret: 'your secret here',
  resave: false,
  saveUninitialized: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDirectory = 'uploads/' + req.session.userEmpID;
        fs.mkdirSync(uploadDirectory, { recursive: true });
        cb(null, uploadDirectory);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

app.get('/deletefile/:file_name', function(req, res){

    var selectedFileForDeletion = req.params.file_name;
    console.log(selectedFileForDeletion);

    function deleteFile(filePath, callback) {
        fs.unlink(filePath, function (err) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        });
    }

    var filePathToDelete = "uploads/" + req.session.userEmpID + "/"  + selectedFileForDeletion;

    deleteFile(filePathToDelete, function (err) {
        if (err) {
            console.error('Error deleting file:', err);
        } else {
            console.log('File deleted successfully.');
        }
    });

    const deleteCriteria = {file_name: selectedFileForDeletion, uploadedBy: req.session.userEmpID};

    files.deleteOne(deleteCriteria, function (err, result) {
        if (err) {
            console.error('Error deleting document:', err);
        } else {
            console.log('Document deleted successfully.');
        }
    });

    res.redirect('/');
});

app.get('/downloadfile/:file_name', function(req, res){
    var selectedFileForDownload = req.params.file_name;
    console.log("user enetered download request" + selectedFileForDownload);
    res.download("./uploads/" + req.session.userEmpID + "/" + selectedFileForDownload);

});


app.get('/', async function (req, res) {
    try {
        if (!req.session.loggedIn) {
            res.redirect('login');
            return;
        }else{
            const documents = await getFiles(req.session.userEmpID);
            userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
            privileges = await getUserPrivileges(userDetailsBlock.user_level);

            res.render('index', {
                title: 'Home Page',
                userDetails: userDetailsBlock,
                filesData: documents
            });
        }

    } catch (error) {
        console.log(error);
    }
});

app.get('/logout', async function(req, res){
    req.session.loggedIn = false;
    req.session.destroy();
    res.redirect('/login');
    console.log("User has logged out!");
});

app.get('/login', async function(req, res){
    try {
        if (req.session.loggedIn) {
            res.redirect('/');
        } else {
            res.render('login', {
                title: 'Login Page'
            });
        }
    } catch (error){
        console.log(error);
    }
});

app.post('/login', async function (req, res) {
    if (req.session.loggedIn) {
        res.redirect('/');
    } else {
        var username = req.body.userName;
        var password = req.body.passWord;

        try {
            const user = await users.findOne({ username: username });
            if (!user) {
                console.log("Failed to find User");
                res.render('login', {
                    title: 'Login Page', receivedError: "Incorrect Username or Password!"
                });
            } else if (password === user.password) {
                req.session.userEmpID = user.emp_id;
                userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
                req.session.loggedIn = true;

                const documents = await getFiles(req.session.userEmpID);
                privileges = await getUserPrivileges(userDetailsBlock.userLevel);

                res.render('index', {
                    title: 'Home Page',
                    userDetails: userDetailsBlock,
                    filesData: documents
                });

                console.log(userDetailsBlock);

                // FOR REMODELING
//                userPrivileges = await getUserPrivileges(req.session.userLevel);
//
//                req.session.userPrivilegesBlock = [];
//
//                for(i=0;i<=)

                console.log("User " + userDetailsBlock.firstName, userDetailsBlock.lastName, userDetailsBlock.empID + " has logged in with " + userDetailsBlock.userLevel + " privileges!");

            } else {
                res.render('login', {
                    title: 'Login Page', receivedError: "Incorrect Username or Password!"
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    }
});

app.get('/createform', async function(req, res){
    if (req.session.loggedIn) {
        userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        privileges = await getUserPrivileges(userDetailsBlock.user_level);
        res.render('createform', {
            title: 'Create Form', userDetails : userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.get('/viewforms', async function(req, res){
    if (req.session.loggedIn) {
        userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        privileges = await getUserPrivileges(userDetailsBlock.user_level);
        res.render('viewforms', {
            title: 'View Forms', userDetails : userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.get('/submission', async function(req, res){
    if (req.session.loggedIn) {
        userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        privileges = await getUserPrivileges(userDetailsBlock.user_level);
        res.render('submissions', {
            title: 'Submissions', userDetails : userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.get('/viewreports', async function(req, res){
    if (req.session.loggedIn) {
        userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        privileges = await getUserPrivileges(userDetailsBlock.user_level);
        res.render('viewreports', {
            title: 'View Reports', userDetails : userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.get('/managenotifications', async function(req, res){
    if (req.session.loggedIn) {
        userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        privileges = await getUserPrivileges(userDetailsBlock.user_level);
        res.render('managenotifications', {
            title: 'Manage Notifications', userDetails : userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.get('/managedeadlines', async function(req, res){
    if (req.session.loggedIn) {
        userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        privileges = await getUserPrivileges(userDetailsBlock.user_level);
        res.render('managedeadlines', {
            title: 'Manage Deadlines', userDetails : userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.get('/createusers', async function(req, res){
    if (req.session.loggedIn) {
        userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        privileges = await getUserPrivileges(userDetailsBlock.user_level);
//        console.log(userDetailsBlock.userLevel) FIX THIS
        res.render('createusers', {
            title: 'Create Users', userDetails : userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.post('/createusers', async function(req, res){
    if (req.session.loggedIn) {
        var username = req.body.userName;
        var password = req.body.passWord;
        var emp_id = req.body.empId;
        var firstname = req.body.firstName;
        var lastname = req.body.lastName;
        var userlevel = req.body.userLevel;

        console.log(username + password + emp_id + firstname + lastname + userlevel);
        try {
            const existingUser = await db.collection('users').findOne({ username: username });
            if(existingUser) {
                console.log("Username already exists!");
            } else {
                const newUser = {
                    "username": username,
                    "password": password,
                    "emp_id": emp_id,
                    "first_name": firstname,
                    "last_name": lastname,
                    "user_level": userlevel
                };

                const result = await db.collection('users').insertOne(newUser);
                console.log("User created");
            }
        } catch (error) {
            console.log("Error creating the user: " + error);
        }
        userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        privileges = await getUserPrivileges(userDetailsBlock.user_level);
        res.render('createusers', {
            title: 'Create Users', userDetails : userDetailsBlock
        });
    } else {
       res.render('login', {
            title: 'Login Page'
       });
    }
});

app.get('/manageuserroles', async function(req, res){
    if (req.session.loggedIn) {
        userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        privileges = await getUserPrivileges(userDetailsBlock.user_level);
        res.render('manageuserroles', {
            title: 'Manage User Roles', userDetails : userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.get('/manageusersettings', async function(req, res){
    if (req.session.loggedIn) {
        userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        privileges = await getUserPrivileges(userDetailsBlock.user_level);
        res.render('manageusersettings', {
            title: 'Manage User Settings', userDetails : userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.get('/viewusers', async function(req, res) {
    try {
        if (!req.session.loggedIn) {
            res.redirect('login');
            return;
        }
        userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        const documents = await getUserAccounts();
        privileges = await getUserPrivileges(userDetailsBlock.user_level);

        res.render('viewusers', {
            title: 'View Users',
            userDetails: userDetailsBlock,
            users: documents
        });
    } catch (error) {
        console.log("Error: " + error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/uploadfiles', async function(req, res){
    if (req.session.loggedIn) {
        userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        privileges = await getUserPrivileges(userDetailsBlock.user_level);
        res.render('uploadfiles', {
            title: 'Upload File Page', userDetails: userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.post('/upload', upload.single('file'), async function (req, res) {
    const uploadedFile = req.file;

    if (!uploadedFile) {
        console.log("No file Uploaded");
    }else{
        const { originalname, size } = uploadedFile;
        console.log("File Uploaded Successfully in " + `/uploads/${userDetailsBlock.firstName}/${originalname}`);
        try{
            uploadInfo = {
                "file_name": originalname,
                "file_size": size,
                "uploadedBy": req.session.userEmpID, // Replace with appropriate user information
                "uploadedAt": new Date() // Include a timestamp
            };
            result = await files.insertOne(uploadInfo);
            console.log("Inserted : " + uploadInfo);
            res.redirect('/');
        } catch(error){
            console.log(error);
        }
    }
});

async function getUserDetailsBlock(empID){
    var userDetailsBlock;

    try{
        const user = await users.findOne({ emp_id: empID });

        if(!user){
            console.log("user not found!");
            console.log("if you are here, you deleted the profile mid-session");
            userDetailsBlock = ""; // future error handling for respective req-res
        }else{
            userDetailsBlock = {
                "firstName": user.first_name,
                "lastName": user.last_name,
                "empID": user.emp_id,
                "userLevel": user.user_level
            }
        }
    }catch(error){
        console.log("Failed to retrieve user details block: " + error);
    }
    console.log("Executed getUserDetailsBlock" + userDetailsBlock);
    return userDetailsBlock;
}



async function getFiles(empID) {
    try {
        const filesDocuments = await files.find({ uploadedBy: empID }).toArray();
        console.log("The array documents at function getFiles() : " + JSON.stringify(filesDocuments)); //stringified for logging purposes only
        return filesDocuments;
    } catch (error) {
        console.log("Failed to retrieve documents: " + error);
    }
}

async function getUserAccounts() {
    try {
        const documents = await users.find({}).toArray();
        console.log("The array documents at function getUserAccounts() : " + JSON.stringify(documents)); //stringified for logging purposes only
        return documents;
    } catch (error) {
        console.log("Failed to retrieve documents: " + error);
    }
}

async function getUserPrivileges(user_level) {
    try {
        const privilegesDocuments = await db.collection('privileges').findOne({ user_level: user_level });

        if (!privilegesDocuments || !privilegesDocuments.user_privileges) {
            console.log("No privileges found for user level: " + user_level);
            return [];
        }
        console.log(privilegesDocuments.user_privileges)
        return privilegesDocuments.user_privileges;
    } catch (error) {
        console.log("Failed to retrieve privileges: " + error);
        return [];
    }
}

// Database initialization
function initializeDatabaseConnection(url,dbName){
    try{
        client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
        client.connect();
        db = client.db(dbName);
        console.log("Connected to the Database.");
    } catch {
        console.log("Failed to connect to the Database!");
        process.exit(0);
    }
}

// Users collection initialization
function initializeUsersCollectionConnection(){
    try{
        users = db.collection('users');
        console.log("Connected to the Database Users Collection.");
    }catch(error){
        console.log(error);
    }
}

// Files collection initialization
function initializeFilesCollectionConnection(){
    try{
        files = db.collection('files');
        console.log("Connected to the Database Files Collection.");
    }catch(error){
        console.log(error);
    }
}

// Privileges collection initialization
function initializePrivilegesCollectionConnection(){
    try{
        privileges = db.collection('privileges');
        console.log("Connected to the Database Privileges Collection.");
    }catch(error){
        console.log(error);
    }
}
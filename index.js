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

initializeDatabaseConnection(url,dbName);
initializeUsersCollectionConnection();
initializeFilesCollectionConnection();

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


app.get('/', async function (req, res) {
    try {
        if (!req.session.loggedIn) {
            res.redirect('login');
            return;
        }else{
            const documents = await getFiles(req.session.userEmpID);

            res.render('index', {
                title: 'Home Page',
                userDetails: req.session.userDetailsBlock,
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
    console.log("Database connection stopped.");
});

app.get('/login', async function(req, res){
    try {
        const filesDocuments = await getFiles(); // why in God's name is this here?
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
                // RESERVED MANUAL DATA BLOCK
                req.session.userFirstName = user.first_name;
                req.session.userLastName = user.last_name;
                req.session.userEmpID = user.emp_id;
                req.session.userLevel = user.user_level;

                // JSON DATA BLOCK
                userDetailsBlock = {
                    "firstName": user.first_name,
                    "lastName": user.last_name,
                    "empID": user.emp_id,
                    "userLevel": user.user_level
                };

                req.session.userDetailsBlock = userDetailsBlock;
                req.session.loggedIn = true;

                const documents = await getFiles(req.session.userEmpID);

                res.render('index', {
                    title: 'Home Page',
                    userDetails: req.session.userDetailsBlock,
                    filesData: documents
                });

                console.log("User " + user.first_name, user.last_name, user.emp_id + " has logged in.");
                console.log(userDetailsBlock);
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
        res.render('createform', {
            title: 'Create Form', userDetails : req.session.userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.get('/viewforms', async function(req, res){
    if (req.session.loggedIn) {
        res.render('viewforms', {
            title: 'View Forms', userDetails : req.session.userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.get('/documentcode', async function(req, res){
    if (req.session.loggedIn) {
        res.render('documentcode', {
            title: 'Document Code', userDetails : req.session.userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.get('/viewreports', async function(req, res){
    if (req.session.loggedIn) {
        res.render('viewreports', {
            title: 'View Reports', userDetails : req.session.userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.get('/managenotifications', async function(req, res){
    if (req.session.loggedIn) {
        res.render('managenotifications', {
            title: 'Manage Notifications', userDetails : req.session.userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.get('/managedeadlines', async function(req, res){
    if (req.session.loggedIn) {
        res.render('managedeadlines', {
            title: 'Manage Deadlines', userDetails : req.session.userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.get('/createusers', async function(req, res){
    if (req.session.loggedIn) {
        res.render('createusers', {
            title: 'Create Users', userDetails : req.session.userDetailsBlock
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
                        res.render('createusers', {
                            title: 'Create Users', userDetails : req.session.userDetailsBlock
                        });
    } else {
       res.render('login', {
            title: 'Login Page'
       });
    }
});

app.get('/manageuserroles', async function(req, res){
    if (req.session.loggedIn) {
        res.render('manageuserroles', {
            title: 'Manage User Roles', userDetails : req.session.userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.get('/manageusersettings', async function(req, res){
    if (req.session.loggedIn) {
        res.render('manageusersettings', {
            title: 'Manage User Settings', userDetails : req.session.userDetailsBlock
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
        const documents = await getUserAccounts();

        res.render('viewusers', {
            title: 'View Users',
            userDetails: req.session.userDetailsBlock,
            users: documents
        });
    } catch (error) {
        console.log("Error: " + error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/uploadfiles', async function(req, res){
    if (req.session.loggedIn) {
        res.render('uploadfiles', {
            title: 'Upload File Page', userDetails: req.session.userDetails
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
const { app,
        express,
        session,
        http,
        socketIo,
        path,
        bodyParser,
        multer,
        fs } = require('./imports.js');

const { MongoClient,
        initializeUsersCollectionConnection,
        initializePrivilegesCollectionConnection,
        initializeFilesCollectionConnection,
        initializeDatabaseConnection } = require('./dbinit.js');

const config = require('./configinit.js');

const url = `mongodb://${config.database.host}:${config.database.port}`;
const dbName = config.database.name;

console.log("debug mode: " + config.debug_mode);

var debug_mode = config.debug_mode;

const db = initializeDatabaseConnection(url,dbName);
var users = initializeUsersCollectionConnection();
var files = initializeFilesCollectionConnection();
var privileges = initializePrivilegesCollectionConnection();

const port = config.port;
const server = http.createServer(app);
const io = socketIo(server);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use('/views/src', express.static(path.join(__dirname, 'views', 'src')));
app.use(express.static(path.join(__dirname, 'views')));
app.use('/uploads', express.static('uploads'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
    session({
        secret: 'your secret here',
        resave: false,
        saveUninitialized: true
    })
);

server.listen(port, () => {
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

    if(debug_mode){
        logStatus(selectedFileForDeletion);
    }

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
            if(debug_mode){
                logStatus('Error deleting file:' + err);
            }
        } else {
            if(debug_mode){
                logStatus('File deleted successfully.');
            }
        }
    });

    const deleteCriteria = {file_name: selectedFileForDeletion, uploadedBy: req.session.userEmpID};

    files.deleteOne(deleteCriteria, function (err, result) {
        if (err) {
            if(debug_mode){
                logStatus('Error deleting document:' + err);
            }
        } else {
            if(debug_mode){
                logStatus('Document deleted successfully.')
            }
        }
    });

    res.redirect('/');
});

app.get('/downloadfile/:file_name', function(req, res){
    var selectedFileForDownload = req.params.file_name;

    if(debug_mode){
        logStatus("user enetered download request" + selectedFileForDownload);
    }

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

app.post('/', upload.single('file'), async function (req, res) {
    const uploadedFile = req.file;

    if(debug_mode){
        logStatus("logging received file count " + req.file);
    }

    if (!uploadedFile) {

        if(debug_mode){
            logStatus("No file Uploaded");
        }

    }else{
        const { originalname, size } = uploadedFile;

        if(debug_mode){
            logStatus("File Uploaded Successfully in " + `/uploads/${userDetailsBlock.firstName}/${originalname}`);
        }

        try{
            uploadInfo = {
                "file_name": originalname,
                "file_size": size,
                "uploadedBy": req.session.userEmpID, // Replace with appropriate user information
                "uploadedAt": new Date() // Include a timestamp
            };
            result = await files.insertOne(uploadInfo);

            if(debug_mode){
                logStatus("Inserted : " + uploadInfo);
            }

            const documents = await getFiles(req.session.userEmpID);

            res.json({documents});
        } catch(error){
            console.log(error);
        }
    }
});

app.get('/logout', async function(req, res){
    req.session.loggedIn = false;
    req.session.destroy();
    res.redirect('/login');

    if(debug_mode){
        logStatus("User has logged out!");
    }

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
        if(debug_mode){
            logStatus(error);
        }

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
                if(debug_mode){
                    logStatus("Failed to find User");
                }
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

                if(debug_mode){
                    logStatus(userDetailsBlock);
                    logStatus("User " + userDetailsBlock.firstName + userDetailsBlock.lastName + userDetailsBlock.empID + " has logged in with " + userDetailsBlock.userLevel + " privileges!");
                }

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
    var requiredPrivilege = 'Create Templates';
    var accessGranted = false;

    if (req.session.loggedIn) {
        userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        privileges = await getUserPrivileges(userDetailsBlock.userLevel);

        accessGranted = validateAction(privileges, requiredPrivilege);

        if(accessGranted){
            res.render('createform', {
                title: 'Create Form', userDetails : userDetailsBlock
            });

            if(debug_mode){
                logStatus("Access Granted!");
            }
        } else {
            res.render('error_screen', {
                title: 'Create Form', userDetails : userDetailsBlock,
                errorMSG : "Access Denied"
            });

            if(debug_mode){
                logStatus("User Denied");
            }
        }
    } else {
        res.redirect('login');
    }
});

app.get('/viewforms', async function(req, res){
    var requiredPrivilege = 'View Documents';
    var accessGranted = false;

    if (req.session.loggedIn) {
        userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        privileges = await getUserPrivileges(userDetailsBlock.userLevel);

        accessGranted = validateAction(privileges, requiredPrivilege);

        if(accessGranted){
            res.render('viewforms', {
                title: 'View Forms', userDetails : userDetailsBlock
            });

            if(debug_mode){
                logStatus("Access Granted!");
            }
        } else {
            res.render('error_screen', {
                title: 'View Forms', userDetails : userDetailsBlock,
                errorMSG : "Access Denied"
            });

            if(debug_mode){
                logStatus("User Denied");
            }
        }

    } else {
        res.redirect('login');
    }
});

app.get('/submission', async function(req, res){
    if (req.session.loggedIn) {
        userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        privileges = await getUserPrivileges(userDetailsBlock.userLevel);

        res.render('submissions', {
            title: 'Submissions', userDetails : userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.get('/viewreports', async function(req, res){
    var requiredPrivilege = 'View Reports';
    var accessGranted = false;

    if (req.session.loggedIn) {
        userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        privileges = await getUserPrivileges(userDetailsBlock.userLevel);

        accessGranted = validateAction(privileges, requiredPrivilege);

        if(accessGranted){
            res.render('viewreports', {
                title: 'View Reports', userDetails : userDetailsBlock
            });
        } else {
            res.render('error_screen', {
                title: 'View Reports', userDetails : userDetailsBlock,
                errorMSG : "Access Denied"
            });
        }


    } else {
        res.redirect('login');
    }
});

app.get('/managenotifications', async function(req, res){
    if (req.session.loggedIn) {
        userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        privileges = await getUserPrivileges(userDetailsBlock.userLevel);
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
        privileges = await getUserPrivileges(userDetailsBlock.userLevel);
        res.render('managedeadlines', {
            title: 'Manage Deadlines', userDetails : userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.get('/createusers', async function(req, res){
    var requiredPrivilege = 'Add User';
    var accessGranted = false;

    if (req.session.loggedIn) {
        userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        privileges = await getUserPrivileges(userDetailsBlock.userLevel);

        accessGranted = validateAction(privileges, requiredPrivilege);

        if(accessGranted) {
            res.render('createusers', {
                title: 'Create Users', userDetails : userDetailsBlock
            });
        } else {
            res.render('error_screen', {
                title: 'Create Users', userDetails : userDetailsBlock,
                errorMSG : "Access Denied"
            });
        }

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
                if(debug_mode){
                    logStatus("Username already exists!");
                }

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
                if(debug_mode){
                    logStatus("User created");
                }

            }
        } catch (error) {
            if(debug_mode){
                logStatus("Error creating the user: " + error);
            }

        }
        userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        privileges = await getUserPrivileges(userDetailsBlock.userLevel);
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
    var requiredPrivilege = 'Edit User';
    var accessGranted = false;

    if (req.session.loggedIn) {
        userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        privileges = await getUserPrivileges(userDetailsBlock.userLevel);

        accessGranted = validateAction(privileges, requiredPrivilege);

        if(accessGranted){
            res.render('manageuserroles', {
                title: 'Manage User Roles', userDetails : userDetailsBlock
            });

            if(debug_mode){
                logStatus("Access Granted!");
            }

        } else {
            res.render('error_screen', {
                title: 'Manage User Roles', userDetails : userDetailsBlock,
                errorMSG : "Access Denied"
            });

            if(debug_mode){
                logStatus("User Denied");
            }
        }

    } else {
        res.redirect('login');
    }
});

app.get('/manageusersettings', async function(req, res){
    var requiredPrivilege = 'Edit User';
    var accessGranted = false;

    if (req.session.loggedIn) {
        userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        privileges = await getUserPrivileges(userDetailsBlock.userLevel);

        accessGranted = validateAction(privileges, requiredPrivilege);

        if(accessGranted){
            res.render('manageusersettings', {
                title: 'Manage User Settings', userDetails : userDetailsBlock
            });

            if(debug_mode){
                logStatus("Access Granted!");
            }

        } else {
            res.render('error_screen', {
                title: 'Manage User Settings', userDetails : userDetailsBlock,
                errorMSG : "Access Denied"
            });

            if(debug_mode){
                logStatus("User Denied");
            }

        }


    } else {
        res.redirect('login');
    }
});

app.get('/viewusers', async function(req, res) {
    var requiredPrivilege = 'Edit User';
    var accessGranted = false;

    try {
        if (!req.session.loggedIn) {
            res.redirect('login');
            return;
        }
        userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        const documents = await getUserAccounts();
        privileges = await getUserPrivileges(userDetailsBlock.userLevel);

        accessGranted = validateAction(privileges, requiredPrivilege);

        if(accessGranted){
            res.render('viewusers', {
                title: 'View Users',
                userDetails: userDetailsBlock,
                users: documents
            });

            if(debug_mode){
                logStatus("Access Granted!");
            }

        } else {
            res.render('error_screen', {
                title: 'View Users', userDetails : userDetailsBlock,
                errorMSG : "Access Denied"
            });

            if(debug_mode){
                logStatus("User Denied");
            }

        }

    } catch (error) {
        if(debug_mode){
            logStatus("Error: " + error);
        }

        res.status(500).send('Internal Server Error');
    }
});

app.get('/uploadfiles', async function(req, res){
    if (req.session.loggedIn) {
        userDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        privileges = await getUserPrivileges(userDetailsBlock.userLevel);
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
        if(debug_mode){
            logStatus("No file Uploaded");
        }

    }else{
        const { originalname, size } = uploadedFile;

        if(debug_mode){
            logStatus("File Uploaded Successfully in " + `/uploads/${userDetailsBlock.firstName}/${originalname}`);
        }

        try{
            uploadInfo = {
                "file_name": originalname,
                "file_size": size,
                "uploadedBy": req.session.userEmpID, // Replace with appropriate user information
                "uploadedAt": new Date() // Include a timestamp
            };
            result = await files.insertOne(uploadInfo);

            if(debug_mode){
                logStatus("Inserted : " + uploadInfo);
            }

            const documents = await getFiles(req.session.userEmpID);

            res.json({documents});
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
            if(debug_mode){
                logStatus("user not found!");
                logStatus("if you are here, you deleted the profile mid-session");
            }

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
        if(debug_mode){
            logStatus("Failed to retrieve user details block: " + error);
        }
    }

    if(debug_mode){
        logStatus("Executed getUserDetailsBlock" + userDetailsBlock);
    }

    return userDetailsBlock;
}

async function getFiles(empID) {
    try {
        const filesDocuments = await files.find({ uploadedBy: empID }).toArray();

        if(debug_mode){
            logStatus("The array documents at function getFiles() : " + JSON.stringify(filesDocuments)); //stringified for logging purposes only
        }

        return filesDocuments;
    } catch (error) {
        if(debug_mode){
            logStatus("Failed to retrieve documents: " + error);
        }

    }
}

async function getUserAccounts() {
    try {
        const documents = await users.find({}).toArray();

        if(debug_mode){
            logStatus("The array documents at function getUserAccounts() : " + JSON.stringify(documents)); //stringified for logging purposes only
        }

        return documents;
    } catch (error) {

        if(debug_mode){
            logStatus("Failed to retrieve documents: " + error);
        }

    }
}

async function getUserPrivileges(user_level) {
    var privilegesDocumentsBlock;
    var privilegesDocuments;

    try {
        privilegesDocuments = await db.collection('privileges').findOne({ user_level: user_level });

        if (!privilegesDocuments || !privilegesDocuments.user_privileges) {

            if(debug_mode){
                logStatus("No privileges found for user level: " + user_level);
            }

            privilegesDocumentsBlock = [];
        } else {
            if(debug_mode){
                logStatus(privilegesDocuments.user_privileges);
            }

            privilegesDocumentsBlock = privilegesDocuments.user_privileges;
        }


    } catch (error) {
        if(debug_mode){
            logStatus("Failed to retrieve privileges: " + error);
        }

        privilegesDocumentsBlock = [];
    }
    return privilegesDocumentsBlock;
}

function validateAction(privileges,requestedAction ){
    var accessGranted = false;
    if(debug_mode){
        logStatus("Received " + privileges + " as privileges");
    }

    try{
	    for(i = 0; i < privileges.length; i++) {
            if(privileges[i] == requestedAction){
                accessGranted = true;
            }
        }
    } catch(error) {
        if(debug_mode){
            logStatus(error);
        }

    }
    if(debug_mode){
        logStatus("Returning " + accessGranted);
    }

    return accessGranted;
}

function logStatus(statusLog){
    console.log(statusLog);
}
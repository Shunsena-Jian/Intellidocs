const { app,
        express,
        session,
        http,
        socketIo,
        path,
        bodyParser,
        multer,
        fs } = require('./imports.js');

const config = require('./configinit.js');

const url = `mongodb://${config.database.host}:${config.database.port}`;
const dbName = config.database.name;


const { MongoClient,
        initializeUsersCollectionConnection,
        initializePrivilegesCollectionConnection,
        initializeFilesCollectionConnection,
        initializeNotificationsCollectionConnection,
        initializeDatabaseConnection,
        initializeFormsCollectionConnection} = require('./dbinit.js');

const db = initializeDatabaseConnection(url,dbName);
const users = initializeUsersCollectionConnection(db);
const files = initializeFilesCollectionConnection(db);
const privileges = initializePrivilegesCollectionConnection(db);
const notifications = initializeNotificationsCollectionConnection(db);
const forms = initializeFormsCollectionConnection(db);

const port = config.port;
const debug_mode = config.debug_mode;
const min_idleTime = config.min_idleTime;
const server = http.createServer(app);
const io = socketIo(server);


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use('/views/src', express.static(path.join(__dirname, 'views', 'src')));
app.use(express.static(path.join(__dirname, 'views')));
app.use('/uploads', express.static('uploads'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var currentUserFiles;
var currentUserDetailsBlock;
var currentUserPrivileges;
var currentUserNotifications;
var filesDocuments;

app.use(
    session({
        secret: 'your secret here',
        resave: false,
        saveUninitialized: true
    })
);


server.listen(port, () => {
    console.log("Server started \nPort: " + port + "\nDebug mode: " + debug_mode + "\nMinimum User idle time: " + min_idleTime);

});


// WebSocket logic
io.on('connection', (socket) => {
    console.log('A user connected');

    //const sessionData = socket.handshake.session;
    //console.log('Session data:', sessionData);

    socket.on('manualPing', (data) => {
        console.log('Received client ping:', data);
        socket.emit('manualPong', 'Server received: ' + data);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
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

app.post('/savecreatedform', async function(req, res){
    try {
        const formData = req.body;

        const formDocument = {
            form_name: formData.name,
            form_control_number: formData.formControlNumber,
            form_content: formData.formContent
        };

        console.log("This is the Form Document: " + JSON.stringify(formDocument));
        const result = await forms.insertOne(formDocument);

        if(debug_mode){
            logStatus("Inserted: " + result);
        }

    } catch (error) {
        logStatus("Failed: " + error);
    }
    res.json({ success: true });
});

app.get('/formview/:form_control_number', async function (req, res){
    try{
        var selectedFormControlNumberToView = req.params.form_control_number;
        var currentForm;

        currentUserFiles = await getFiles(req.session.userEmpID);
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);
        currentForm = await forms.findOne({ form_control_number : selectedFormControlNumberToView });

        res.render('formview', {
            title: 'View Forms',
            currentUserDetailsBlock : currentUserDetailsBlock,
            currentUserFiles: currentUserFiles,
            currentUserPrivileges: currentUserPrivileges,
            currentUserNotifications: currentUserNotifications,
            currentForm: currentForm,
            min_idleTime: min_idleTime
        });

    }catch(error){
        console.log("we found an error");
    }
});

app.get('/', async function (req, res) {
    try {
        if (!req.session.loggedIn) {
            res.redirect('login');
            return;
        }else{
            currentUserFiles = await getFiles(req.session.userEmpID);
            currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
            currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
            currentUserNotifications = await getNotifications(req.session.userEmpID);

            res.render('index', {
                title: 'Home Page',
                currentUserDetailsBlock: currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                min_idleTime: min_idleTime
            });
        }

    } catch (error) {
        console.log(error);
    }
});

app.get('/accountsettings', async function (req, res) {
    try {
        if (!req.session.loggedIn) {
            res.redirect('login');
            return;
        }else{
            currentUserFiles = await getFiles(req.session.userEmpID);
            currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
            currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
            currentUserNotifications = await getNotifications(req.session.userEmpID);

            res.render('accountsettings', {
                title: 'Account Settings',
                currentUserDetailsBlock: currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                min_idleTime: min_idleTime
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
            logStatus("File Uploaded Successfully in " + `/uploads/${currentUserDetailsBlock.firstName}/${originalname}`);
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

app.delete('/ajaxdelete/:file_name', async function (req, res) {

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

    await files.deleteOne(deleteCriteria, function (err, result) {
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

    const documents = await getFiles(req.session.userEmpID);

    res.json({documents});
});

app.put('/reseat/:empID', async function (req, res) {
    var dataPlaceholder = "success!!";
    try{
        var reconnectingEmpID = req.params.empID;
        req.session.userEmpID = reconnectingEmpID; //possible hacking - TO BE RESOLVED
        req.session.loggedIn = true;
        res.json({dataPlaceholder});
        console.log("user reseated!");
    }catch(error){
        res.json({error});
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
                req.session.loggedIn = true;
                req.session.userEmpID = user.emp_id;

                currentUserFiles = await getFiles(req.session.userEmpID);
                currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
                currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
                currentUserNotifications = await getNotifications(req.session.userEmpID);

                res.render('index', {
                    title: 'Home Page',
                    currentUserDetailsBlock: currentUserDetailsBlock,
                    currentUserFiles: currentUserFiles,
                    currentUserPrivileges: currentUserPrivileges,
                    currentUserNotifications: currentUserNotifications,
                    min_idleTime: min_idleTime
                });

                if(debug_mode){
                    logStatus(currentUserDetailsBlock);
                    logStatus("User " + currentUserDetailsBlock.firstName + currentUserDetailsBlock.lastName + currentUserDetailsBlock.empID + " has logged in with " + currentUserDetailsBlock.userLevel + " privileges!");
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
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);

        accessGranted = validateAction(currentUserPrivileges, requiredPrivilege);

        if(accessGranted){
            res.render('createform', {
                title: 'Create Form',
                currentUserDetailsBlock : currentUserDetailsBlock,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                min_idleTime: min_idleTime
            });

            if(debug_mode){
                logStatus("Access Granted!");
            }
        } else {
            res.render('error_screen', {
                title: 'Create Form',
                currentUserDetailsBlock : currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                min_idleTime: min_idleTime,
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
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);
        currentForms = await getForms(req.session.userEmpID);

        accessGranted = validateAction(currentUserPrivileges, requiredPrivilege);

        if(accessGranted){
            res.render('viewforms', {
                title: 'View Forms',
                currentUserDetailsBlock : currentUserDetailsBlock,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                currentForms: currentForms,
                min_idleTime: min_idleTime
            });

            if(debug_mode){
                logStatus("Access Granted!");
            }
        } else {
            res.render('error_screen', {
                title: 'View Forms',
                currentUserDetailsBlock : currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                min_idleTime: min_idleTime,
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


app.get('/viewformtemplates', async function(req, res){
    var requiredPrivilege = 'View Documents';
    var accessGranted = false;

    if (req.session.loggedIn) {
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);
        currentForms = await getForms(req.session.userEmpID);

        accessGranted = validateAction(currentUserPrivileges, requiredPrivilege);

        if(accessGranted){
            res.render('viewforms', {
                title: 'View Form Templates',
                currentUserDetailsBlock : currentUserDetailsBlock,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                currentForms: currentForms,
                min_idleTime: min_idleTime
            });

            if(debug_mode){
                logStatus("Access Granted!");
            }
        } else {
            res.render('error_screen', {
                title: 'View Forms',
                currentUserDetailsBlock : currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                min_idleTime: min_idleTime,
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
        currentUserFiles = await getFiles(req.session.userEmpID);
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);

        res.render('submissions', {
            title: 'Submissions',
            currentUserDetailsBlock : currentUserDetailsBlock,
            currentUserFiles: currentUserFiles,
            currentUserPrivileges: currentUserPrivileges,
            currentUserNotifications: currentUserNotifications,
            min_idleTime: min_idleTime
        });
    } else {
        res.redirect('login');
    }
});

app.get('/viewreports', async function(req, res){
    var requiredPrivilege = 'View Reports';
    var accessGranted = false;

    if (req.session.loggedIn) {
        currentUserFiles = await getFiles(req.session.userEmpID);
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);

        accessGranted = validateAction(currentUserPrivileges, requiredPrivilege);

        if(accessGranted){
            res.render('viewreports', {
                title: 'View Reports',
                currentUserDetailsBlock : currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                min_idleTime: min_idleTime
            });
        } else {
            res.render('error_screen', {
                title: 'View Reports',
                currentUserDetailsBlock : currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                min_idleTime: min_idleTime,
                errorMSG : "Access Denied"
            });
        }


    } else {
        res.redirect('login');
    }
});

app.get('/managenotifications', async function(req, res){
    if (req.session.loggedIn) {
        currentUserFiles = await getFiles(req.session.userEmpID);
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);

        res.render('managenotifications', {
            title: 'Manage Notifications',
            currentUserDetailsBlock : currentUserDetailsBlock,
            currentUserFiles: currentUserFiles,
            currentUserPrivileges: currentUserPrivileges,
            currentUserNotifications: currentUserNotifications,
            min_idleTime: min_idleTime
        });
    } else {
        res.redirect('login');
    }
});

app.get('/managedeadlines', async function(req, res){
    if (req.session.loggedIn) {
        currentUserFiles = await getFiles(req.session.userEmpID);
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);


        res.render('managedeadlines', {
            title: 'Manage Deadlines',
            currentUserDetailsBlock: currentUserDetailsBlock,
            currentUserFiles: currentUserFiles,
            currentUserPrivileges: currentUserPrivileges,
            currentUserNotifications: currentUserNotifications,
            min_idleTime: min_idleTime
        });
    } else {
        res.redirect('login');
    }
});

app.get('/createusers', async function(req, res){
    var requiredPrivilege = 'Add User';
    var accessGranted = false;

    if (req.session.loggedIn) {
        currentUserFiles = await getFiles(req.session.userEmpID);
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);

        accessGranted = validateAction(currentUserPrivileges, requiredPrivilege);

        if(accessGranted) {
            res.render('createusers', {
                title: 'Create Users',
                currentUserDetailsBlock: currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                min_idleTime: min_idleTime
            });
        } else {
            res.render('error_screen', {
                title: 'Create Users',
                userDetails: currentUserDetailsBlock,
                filesData: currentUserFiles,
                userPrivileges: currentUserPrivileges,
                userNotifications: currentUserNotifications,
                min_idleTime: min_idleTime,
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

        currentUserFiles = await getFiles(req.session.userEmpID);
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);

        res.render('createusers', {
            title: 'Create Users',
            currentUserDetailsBlock: currentUserDetailsBlock,
            currentUserFiles: currentUserFiles,
            currentUserPrivileges: currentUserPrivileges,
            currentUserNotifications: currentUserNotifications,
            min_idleTime: min_idleTime
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
        currentUserFiles = await getFiles(req.session.userEmpID);
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);

        accessGranted = validateAction(currentUserDetailsBlock, requiredPrivilege);

        if(accessGranted){
            res.render('manageuserroles', {
                title: 'Manage User Roles',
                currentUserDetailsBlock: currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                min_idleTime: min_idleTime
            });

            if(debug_mode){
                logStatus("Access Granted!");
            }

        } else {
            res.render('error_screen', {
                title: 'Manage User Roles',
                currentUserDetailsBlock: currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                min_idleTime: min_idleTime,
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
        currentUserFiles = await getFiles(req.session.userEmpID);
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);

        accessGranted = validateAction(currentUserPrivileges, requiredPrivilege);

        if(accessGranted){
            res.render('manageusersettings', {
                title: 'Manage User Settings',
                currentUserDetailsBlock: currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                min_idleTime: min_idleTime
            });

            if(debug_mode){
                logStatus("Access Granted!");
            }

        } else {
            res.render('error_screen', {
                title: 'Manage User Settings',
                currentUserDetailsBlock: currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                min_idleTime: min_idleTime,
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

        userAccounts = await getUserAccounts();
        currentUserFiles = await getFiles(req.session.userEmpID);
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);

        accessGranted = validateAction(currentUserPrivileges, requiredPrivilege);

        if(accessGranted){
            res.render('viewusers', {
                title: 'View Users',
                currentUserDetailsBlock: currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                min_idleTime: min_idleTime,
                userAccounts: userAccounts
            });

            if(debug_mode){
                logStatus("Access Granted!");
            }

        } else {
            res.render('error_screen', {
                title: 'View Users',
                currentUserDetailsBlock: currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                min_idleTime: min_idleTime,
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
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        privileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        res.render('uploadfiles', {
            title: 'Upload File Page', userDetails: currentUserDetailsBlock
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

async function logError(errorMessage) {
    const logMessage = `${new Date().toISOString()}: ${errorMessage}\n`;
    fs.appendFile('error_log.txt', logMessage, (err) => {
        if (err) {
            console.error('Error appending to error_log.txt:', err);
        }
    });
}


async function getNotifications(empID){
    var userNotifications;

    try { // TO BE FIXED ERROR RECEIVED WHEN NULL
        userNotifications = await notifications.find({ recipients: empID }).toArray();
        if (debug_mode) {
            logStatus("The notifications are: " + JSON.stringify(userNotifications));
        }
    } catch (error) {
        if (debug_mode) {
            logStatus("Failed to retrieve unseen notifications: " + error);
        }
        throw error; // Re-throw the error to handle it elsewhere if needed
    }

    return userNotifications;
}

async function getForms(empID){
    var formsCollections;
    try {
        formsCollections = await forms.find().toArray();

        if(debug_mode){
            logStatus("The array forms at function getForms() : " + JSON.stringify(formsCollections));
        }
    } catch (error) {
        formsCollections = [];
        if(debug_mode){
            logStatus("Failed to retrieve forms: " + error);
        }
    }
    return formsCollections;
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
        //privilegesDocuments = await db.collection('privileges').findOne({ user_level: user_level });
        privilegesDocuments = await privileges.findOne({ user_level: user_level });

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
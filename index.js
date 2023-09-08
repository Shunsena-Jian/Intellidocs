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

// Connect to the database
const url = 'mongodb://127.0.0.1/intellijent';
const dbName = 'intellijent';

var users;
async function connectDatabase(){
    try{
        client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        db = client.db(dbName);
        console.log("Connected to the Database.");
        try{
            users = db.collection('users');
            console.log("User Collection Initiated");
        }catch(error){
            console.log("Failed to connect to the database: " + error);
            process.exit(0);
        }
    } catch(error){
        console.log("Failed to connect to the database: " + error);
        process.exit(0);
    }
}

async function closeDatabase() {
  if (client) {
    await client.close();
    console.log('Users collection closed');
  }
}

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

const getUploadDirectory = (req, file, cb) => {
  // Replace 'getUserFirstName' with your actual method to get the user's first name
  const empID = req.session.userDetailsBlock.empID;

  // Create the user's directory if it doesn't exist
  const uploadDirectory = `uploads/${empID}`;
  fs.mkdirSync(uploadDirectory, { recursive: true });

  cb(null, uploadDirectory);
};

// Handles file uploads by specifying the destination and filename for uploaded files.
const storage = multer.diskStorage({
  destination: getUploadDirectory,
  filename: function (req, file, cb) {
    //const currentDate = new Date();
    //const formattedDate = `${currentDate.getMonth() + 1}-${currentDate.getDate()}-${currentDate.getFullYear()}`;

    //cb(null, formattedDate + '-' + file.originalname); // Specify the filename
    cb(null, file.originalname); // Specify the filename
  }
});

const upload = multer({ storage: storage });
app.use('/uploads', express.static('uploads'));

app.get('/', async function(req, res){
    await connectDatabase();
    if (req.session.loggedIn) {
        res.render('index', {
            title: 'Home Page', userDetails : req.session.userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
    await closeDatabase();
});

app.get('/logout', async function(req, res){
    req.session.loggedIn = false;
    req.session.destroy();
    await closeDatabase();
    res.redirect('/login');
    console.log("User has logged out!");
    console.log("Database connection stopped.");
});

app.get('/login', async function(req, res){
    await closeDatabase();
    if (req.session.loggedIn) {
        res.redirect('/');
        await closeDatabase();
    } else {
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.post('/login', async function (req, res) {
    await connectDatabase();
    if (req.session.loggedIn) {
        res.render('index', {
            title: 'Home Page', userDetails: req.session.userDetails
        });
        await closeDatabase();
    } else {
        var username = req.body.userName;
        var password = req.body.passWord;

        try {
            const user = await users.findOne({ username: username });
            if (!user) {
                console.log("Failed to find User");
                res.render('login', {
                    title: 'Login Page', receivedError: "Wrong User Credentials!"
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

                res.render('index', {
                    title: 'Home Page', userDetails: req.session.userDetailsBlock
                });
                console.log("User " + user.first_name, user.last_name, user.emp_id + " has logged in.");
                console.log(req.session.userDetailsBlock);

                await closeDatabase();
            } else {
                res.render('login', {
                    title: 'Login Page', name: "Wrong User Credentials"
                });
                console.log("Wrong User Credentials!");
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        } finally {
        if (client) {
            await client.close();
        }
        }
    }
});

app.get('/createform', async function(req, res){
    await connectDatabase();
    if (req.session.loggedIn) {
        res.render('createform', {
            title: 'Create Form', userDetails : req.session.userDetailsBlock
        });
        await closeDatabase();
    } else {
        res.redirect('login');
    }
});

app.get('/viewforms', async function(req, res){
    await connectDatabase();
    if (req.session.loggedIn) {
        res.render('viewforms', {
            title: 'View Forms', userDetails : req.session.userDetailsBlock
        });
        await closeDatabase();
    } else {
        res.redirect('login');
    }
});

app.get('/documentcode', async function(req, res){
    await connectDatabase();
    if (req.session.loggedIn) {
        res.render('documentcode', {
            title: 'Document Code', userDetails : req.session.userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.get('/viewreports', async function(req, res){
    await connectDatabase();
    if (req.session.loggedIn) {
        res.render('viewreports', {
            title: 'View Reports', userDetails : req.session.userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.get('/managenotifications', async function(req, res){
    await connectDatabase();
    if (req.session.loggedIn) {
        res.render('managenotifications', {
            title: 'Manage Notifications', userDetails : req.session.userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.get('/managedeadlines', async function(req, res){
    await connectDatabase();
    if (req.session.loggedIn) {
        res.render('managedeadlines', {
            title: 'Manage Deadlines', userDetails : req.session.userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.get('/createusers', function(req, res){
    if (req.session.loggedIn) {
        res.render('createusers', {
            title: 'Create Users', userDetails : req.session.userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.post('/createusers', async function(req, res){
    await connectDatabase();
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
    await connectDatabase();
    if (req.session.loggedIn) {
        res.render('manageuserroles', {
            title: 'Manage User Roles', userDetails : req.session.userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.get('/manageusersettings', async function(req, res){
    await connectDatabase();
    if (req.session.loggedIn) {
        res.render('manageusersettings', {
            title: 'Manage User Settings', userDetails : req.session.userDetailsBlock
        });
    } else {
        res.redirect('login');
    }
});

app.get('/viewusers', async function(req, res) {
    await connectDatabase();
    try {
        if (!req.session.loggedIn) {
            res.redirect('login');
            return;
        }
        const documents = await fetchUserAccounts();
        var users = [];

        for (let i = 0; i < documents.length; i++) {
            var values = Object.values(documents[i]);
            users.push(values);
        }

        res.render('viewusers', {
            title: 'View Users',
            userDetails: req.session.userDetailsBlock,
            users: users // Pass the users data to the view
        });
    } catch (error) {
        console.log("Error: " + error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/uploadfiles', async function(req, res){
    await connectDatabase();
    if (req.session.loggedIn) {
        res.render('uploadfiles', {
            title: 'Upload File Page'
        });
    } else {
        res.redirect('login');
    }
});

app.post('/upload', upload.single('file'), async function (req, res) {
    await connectDatabase();
    const uploadedFile = req.file;

    if (!uploadedFile) {
        console.log("No file Uploaded");
    }

    const { originalname, filename, size } = uploadedFile;
    console.log("File Uploaded Successfully in " + `/uploads/${userDetailsBlock.firstName}/${filename}`);
});


async function fetchUserAccounts() {
    try {
        const collection = db.collection('users');
        const documents = await collection.find({}).toArray();

        return documents;
    } catch (error) {
        console.log("Failed to retrieve documents: " + error);
    }
}
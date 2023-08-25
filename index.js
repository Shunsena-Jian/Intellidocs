const express = require('express');
const session = require('express-session');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const port = 3000;
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
var name = null;

// Connect to the database
mongoose.connect('mongodb://127.0.0.1/intellijent', {useNewUrlParser: true, useUnifiedTopology: true});

app.use(session({
  secret: 'your secret here',
  resave: false,
  saveUninitialized: true
}));

function checkLoggedIn(req, res, next) {
    if (req.session.loggedIn) {
        next();
    } else {
        res.redirect('/login');
    }
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    emp_id: Number,
    first_name: String,
    last_name: String
  });

const User = mongoose.model('User', userSchema);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.get('/', checkLoggedIn, function(req, res){
    if (req.session.loggedIn) {
        res.redirect('/'); // if logged in
    } else {
        res.redirect('login'); // if not logged in
    }
        // res.render('index', {
        //     title: 'Home page'
        // });
        // console.log(req.session.first_name);
});

app.get('/logout', function(req, res){
    req.session.destroy();
    res.redirect('/login');
    console.log("User has logged out!");
});

app.get('/login', function(req, res){
    if (req.session.loggedIn) {
        res.redirect('/index');
    } else {
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.post('/login', function (req, res) {
    if(req.session.loggedIn){
        res.render('index', {
            title: 'Home Page', first_name: req.session.first_name, last_name: req.session.last_name
        });
    } else {
        var username = req.body.userName;
        var password = req.body.passWord;

        User.findOne({ username: username }) // finds the inputted username
        .then(function(user) {
            if (!user) {
                console.log("Failed to find User");
                res.render('login', {
                    title: 'Login Page', receivedError: "Wrong User Credentials!"
                });
            } else if (password === user.password) { // if correct password

                req.session.loggedIn = true;
                req.session.username = user.username;
                req.session.emp_id = user.emp_id;
                req.session.first_name = user.first_name;
                req.session.last_name = user.last_name;                

                res.render('index', {
                    title: 'Home Page', name: user.username
                });
                console.log("User " + user.first_name, user.last_name, user.emp_id + " has logged in.");
            } else {
                res.render('login', {
                    title: 'Login Page', name: "Wrong User Credentials"
                });
                console.log("Wrong User Credentials!");
            }
        })
        .catch(function(error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        });
    }
});

app.get('/createform', function(req, res){
    if(req.session.loggedIn) {
        res.redirect('/createform');
    } else {
        res.render('createform', {
            title: 'CREATE FORM', name: name
        });
    }
});

app.get('/createuser', function(req, res){

    if (req.session.loggedIn) {
        res.redirect('/createuser');
    } else {
        res.render('createuser', {
            title: 'CREATE USER', name: name
        });
    }
});

app.get('/viewform', function(req, res){
    if(req.session.loggedIn) {
        res.redirect('/viewform');
    } else {
        res.render('viewform', {
            title: 'View Forms', name: name
        });
    }        
});
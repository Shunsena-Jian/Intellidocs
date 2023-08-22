const express = require('express');
const session = require('express-session');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const port = 3000;

mongoose.connect('mongodb://127.0.0.1/intellijenttesting', {useNewUrlParser: true, useUnifiedTopology: true});
console.log("Successfully Connected to the database!");

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(session({
  secret: 'your secret here',
  resave: false,
  saveUninitialized: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//IMAGINE THIS TO BE A METHOD GRABBING USER CREDS FROM MONGOOSE
var name = "Jiannis Cudiamititis";
//-----------------

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.get('/', function(req, res){
        res.render('index', {
            title: 'Home page'
        });
        console.log();
});

app.get('/login', function(req, res){
        res.render('login', {
            title: 'Login Page', name: name
        });
});


const userSchema = new mongoose.Schema({
          username: String,
          password: String,
          first_name: String,
          last_name: String
        });

const User = mongoose.model('User', userSchema);

app.post('/login', function (req, res) {
    var username = req.body.userName;
    var password = req.body.passWord;

    User.findOne({ username: username })
        .then(function(user) {
            if (!user) {
                console.log("failure to find user");
                res.render('login', {
                    title: 'Login Page', name: "Wrong Answer Beech"
                });
            } else if (password === user.password) {
                res.render('index', {
                    title: 'Home Page', name: user.username
                });
                console.log("correct user password OMG");
            } else {
                res.render('login', {
                    title: 'Login Page', name: "Wrong Answer Beech"
                });
                console.log("wrong everything shet");
            }
        })
        .catch(function(error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        });
});

app.get('/createform', function(req, res){
        res.render('createform', {
            title: 'CREATE FORM', name: name
        });
});

app.get('/createuser', function(req, res){
        res.render('createuser', {
            title: 'CREATE USER', name: name
        });
});

app.get('/viewform', function(req, res){
        res.render('viewform', {
            title: 'View Forms', name: name
        });
});
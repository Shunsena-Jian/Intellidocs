const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const session = require('express-session');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');

module.exports = {
    app,
    express,
    MongoClient,
    session,
    http,
    socketIo,
    path,
    bodyParser,
    multer,
    fs
};
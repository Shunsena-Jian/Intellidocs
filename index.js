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
//engine
const { JSDOM } = require('jsdom');
//end of engine

const { MongoClient,
        initializeUsersCollectionConnection,
        initializePrivilegesCollectionConnection,
        initializeFilesCollectionConnection,
        initializeNotificationsCollectionConnection,
        initializeDatabaseConnection,
        initializeFormsCollectionConnection,
        initializeWidgetsCollectionConnection,
        initializeFilledOutFormCollectionConnection } = require('./dbinit.js');

const db = initializeDatabaseConnection(url,dbName);
const users = initializeUsersCollectionConnection(db);
const files = initializeFilesCollectionConnection(db);
const privileges = initializePrivilegesCollectionConnection(db);
const notifications = initializeNotificationsCollectionConnection(db);
const forms = initializeFormsCollectionConnection(db);
const widgets = initializeWidgetsCollectionConnection(db);
const filledoutforms = initializeFilledOutFormCollectionConnection(db);

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
    //console.log('A user connected');

    //const sessionData = socket.handshake.session;
    //console.log('Session data:', sessionData);

    socket.on('manualPing', (data) => {
        console.log('Received client ping:', data);
        socket.emit('manualPong', 'Server received: ' + data);
    });

    socket.on('disconnect', () => {
        //console.log('A user disconnected');
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

const pictureStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDirectory = 'views/profile_pictures/' + req.session.userEmpID;
        fs.mkdirSync(uploadDirectory, { recursive: true });
        cb(null, uploadDirectory);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const pictureUpload = multer({ storage: pictureStorage });

app.get('/deletefile/:file_name', function(req, res){
    var selectedFileForDeletion = req.params.file_name;

    if(debug_mode){
        logStatus("No file being deleted get delete file function: " + selectedFileForDeletion);
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
                logStatus("Error deleting file:" + err);
            }
        } else {
            if(debug_mode){
                logStatus("File deleted successfully.");
            }
        }
    });

    const deleteCriteria = {file_name: selectedFileForDeletion, uploadedBy: req.session.userEmpID};

    files.deleteOne(deleteCriteria, function (err, result) {
        if (err) {
            if(debug_mode){
                logStatus("Error deleting document:" + err);
            }
        } else {
            if(debug_mode){
                logStatus("Document deleted successfully.")
            }
        }
    });
    res.redirect('/');
});

app.get('/downloadfile/:file_name', function(req, res){
    var selectedFileForDownload = req.params.file_name;

    if(debug_mode){
        logStatus("User entered download request: " + selectedFileForDownload);
    }

    res.download("./uploads/" + req.session.userEmpID + "/" + selectedFileForDownload);

});

//ENGINE
//-------------------------HTML TO JSON

async function addKeyId(){

}

async function htmlToJson(element) {
    const jsonElementFormat = {
        ele_type: element.nodeName ? element.nodeName.toLowerCase() : 'unknown',
        ele_attributes: {
            key: null,
        },
        ele_contents: [],
    };

    if (element.attributes) {
        for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes.item(i);
            jsonElementFormat.ele_attributes[attr.name] = attr.value;
        }
    }

    if (element.childNodes) {
        for (let i = 0; i < element.childNodes.length; i++) {
            const childNode = element.childNodes[i];
            if (childNode.nodeType === 1) {
                const childJson = await htmlToJson(childNode);
                jsonElementFormat.ele_contents.push(childJson);
            } else if (childNode.nodeType === 3) {
                const trimmedText = childNode.textContent.trim();
                if (trimmedText !== '') {
                    jsonElementFormat.ele_contents.push(trimmedText);
                }
            }
        }
    }

    return jsonElementFormat;
}
//-------------------------JSON TO HTML

async function jsonToHTML(jsonDataArray, indentLevel = 0) {
    const selfClosingTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    const indent = '    '.repeat(indentLevel);

    let html = '';

    for (const jsonData of jsonDataArray) {
        html += `${indent}<${jsonData.ele_type}`;

        for (const [attributeName, attributeValue] of Object.entries(jsonData.ele_attributes)) {
            html += ` ${attributeName}="${attributeValue}"`;
        }

        const isSelfClosing = selfClosingTags.includes(jsonData.ele_type);

        if (isSelfClosing) {
            html += '>\n';
        } else {
            html += '>\n';

            for (const child of jsonData.ele_contents) {
                if (typeof child === 'object') {
                    html += await jsonToHTML([child], indentLevel + 1);
                } else {
                    html += `${'    '.repeat(indentLevel + 1)}${child}\n`;
                }
            }

            html += `${indent}</${jsonData.ele_type}>\n`;
        }
    }

    return html;
}

/*async function getLatestuserVersion(owner, controlNumber){
    console.log("looking for " + owner + " of " + controlNumber);
    var versionList = await filledoutforms.find({ form_control_number : controlNumber, form_owner : owner }).toArray();
    console.log("logging version list var" + JSON.stringify(versionList));
    var versionCount = 0;
    var latestUserVersion = 0;


    for(i=0; i < versionList.length; i++){
        if(versionList[i].form_version >= latestUserVersion){
            latestUserVersion = versionList[i].form_version;
        }
        versionCount = versionCount + 1;
        console.log("logging version" + versionList[i].form_version + " of " + controlNumber);
    }


    console.log(versionCount);
    console.log(latestUserVersion + "is the latest version");
}
*/


//END OF ENGINE
app.post('/savecreatedform', async function(req, res){
    try {
        var latestForm;
        var currentDate = new Date();
        var date = currentDate.toDateString();
        var time = currentDate.toTimeString().split(' ')[0];
        var formData = req.body;
        //------------------ENGINE PLAYGROUND
        var v = new JSDOM(formData.formContent);
        var rootElement = v.window.document.querySelector('.drop-container');
        var jsonArray = [];
        var w = await htmlToJson(rootElement);
        jsonArray.push(w);
        // var x = JSON.stringify([w],null,2); // goods
        // console.log(x); // goods

        // var y = JSON.parse(x);
        // var z = await jsonToHTML(y);
        // console.log(z);
        //------------------END OF PLAYGROUND

        // PLAYGROUND NI JIAN
        latestForm = await forms.findOne({ form_name : formData.name });

        if(latestForm && formData.name === latestForm.form_name){
            res.json({ status_code : 1 });// Form Name already exists
        } else {
            const formDocument = {
                form_name: formData.name,
                form_control_number: formData.formControlNumber.toString(),
                //form_content: formData.formContent,
                form_content: jsonArray,
                form_version: 0,
                form_status: formData.formStatus,
                shared_status: false,
                allow_file_upload: false,
                date_saved: getDateNow(),
                time_saved: getTimeNow()
            };

            //console.log("This is the Form Document: " + JSON.stringify(formDocument));
            const result = await forms.insertOne(formDocument);

            if(debug_mode){
                logStatus("Created form saved at database: " + result);
            }

            res.json({ success: true });
        }
    } catch (error) {
        logStatus("Error at saved created form: " + error);
    }
});

app.post('/saveformversion', async function(req, res){
    var formData = req.body;
    var latestVersion = 0;
    var newVersionNumber = 0;
    var formHistory = await forms.find({ form_control_number : formData.formControlNumber }).toArray();
    console.log("THE LENGTH IS" + formHistory.length);
    console.log("WE ARE LOOKING FOR THIS CONTROL NUMBER " + formData.formControlNumber);
    for(i=0; i < formHistory.length; i++) {
        console.log("Entered 334 iteration");
        if(formHistory[i].form_version >= latestVersion) {
            latestVersion = formHistory[i].form_version;
            fileUploadStatus = formHistory[i].allow_file_upload;
            console.log("block 333 iterated versioning" + formHistory[i]);
        }
    }
    newVersionNumber = latestVersion + 1;
    console.log("This is the quack: " + newVersionNumber);

    try {
        var latestForm;
        var currentDate = new Date();
        var date = currentDate.toDateString();
        var time = currentDate.toTimeString().split(' ')[0];
        var formData = req.body;
        var v = new JSDOM(formData.formContent);
        var rootElement = v.window.document.querySelector('.drop-container');
        var jsonArray = [];
        var w = await htmlToJson(rootElement);
        jsonArray.push(w);

        const formDocument = {
            form_name: formData.name,
            form_control_number: formData.formControlNumber.toString(),
            //form_content: formData.formContent,
            form_content: jsonArray,
            form_version: newVersionNumber,
            form_status: formData.formStatus,
            shared_status: Boolean(formData.sharedStatus),
            allow_file_upload: fileUploadStatus,
            date_saved: getDateNow(),
            time_saved: getTimeNow()
        };

        //console.log("This is the Form Document: " + JSON.stringify(formDocument));
        const result = await forms.insertOne(formDocument);

        if(debug_mode){
            logStatus("Saved new form version in database: " + result);
        }

        res.json({ success: true });

    } catch (error) {
        logStatus("Error at save form version: " + error);
    }
});

app.post('/savecreatedwidget', async function(req, res){
    try {
        var widgetData = req.body;
        //------------------ENGINE PLAYGROUND ---- WILL CONVERT WIDGET TO JSON WHEN ENGINE READY
        //var v = new JSDOM(formData.formContent);
        //var rootElement = v.window.document.querySelector('.drop-container');
        //var w = await htmlToJson(rootElement);
        //var x = JSON.stringify([w],null,2); // goods
        //console.log(x); // goods

        //var y = JSON.parse(x);
        //var z = await jsonToHTML(y);
        //console.log(z);
        //------------------END OF PLAYGROUND

        const widgetDocument = {
            widget_name: widgetData.name,
            widget_content: widgetData.widgetContent,
            widget_owner: req.session.userEmpID
        };

        //console.log("This is the Form Document: " + JSON.stringify(formDocument));
        const result = await widgets.insertOne(widgetDocument);

        if(debug_mode){
            logStatus("Saved created widget in database: " + result);
        }

    } catch (error) {
        logStatus("Error at save created widget: " + error);
    }
    res.json({ success: true });
});

app.post('/formautosave', async function (req, res){
    try{
        var formData = req.body;
        var currentDate = new Date();
        var date = currentDate.toDateString();
        var time = currentDate.toTimeString().split(' ')[0];
        var v = new JSDOM(formData.formContent);
        var rootElement = v.window.document.querySelector('.drop-container');
        var jsonArray = [];
        var w = await htmlToJson(rootElement);
        jsonArray.push(w);

        const formDocument = {
            form_name: formData.formName,
            form_control_number: formData.formControlNumber.toString(),
            form_content: jsonArray,
            form_version: formData.formVersion + 1,
            form_status: formData.formStatus,
            last_edited: `${date} ${time}`
        };

        const result = await filledoutforms.insertOne(formDocument);
        res.send({ status_code : 0});
    } catch (error) {
        logStatus("Error at form view POST: " + error);
    }

});

function getDateNow(){
    var currentDate = new Date();
    var date = currentDate.toDateString();

    return date;
}

function getTimeNow(){
    var currentDate = new Date();
    var time = currentDate.toTimeString().split(' ')[0];

    return time;
}

app.put('/savefilledoutform', async function(req, res){
    var selectedFormControlNumberToView = req.session.form_control_number;
    formVersions = await forms.find({ form_control_number : selectedFormControlNumberToView }).toArray();
    var latestVersion = 0;
    var latestUserVersion = 0;
    var initialUserVersion = 0;
    var latestSharedStatus;
    var latestWriteUsers = [];
    var latestReadUsers = [];
    var currentForm = await forms.findOne({ form_control_number : selectedFormControlNumberToView, form_version: latestVersion });
    var userFormVersions = await filledoutforms.find({ form_control_number : selectedFormControlNumberToView,  form_owner: req.session.userEmpID}).toArray();
    var allUserFormVersions = [];

    for(i=0; i < formVersions.length; i++){
        if(formVersions[i].form_version >= latestVersion){
            latestVersion = formVersions[i].form_version;
        }
    }

    for(i=0; i < userFormVersions.length; i++){
        if(userFormVersions[i].user_version >= latestUserVersion){
            latestUserVersion = userFormVersions[i].user_version;
            latestSharedStatus = userFormVersions[i].shared_status;
            if(userFormVersions[i].read_users){
                let uniqueReadUsers = new Set([...latestReadUsers, ...userFormVersions[i].read_users]);
                latestReadUsers = Array.from(uniqueReadUsers);
            }
            if(userFormVersions[i].write_users){
                let uniqueWriteUsers = new Set([...latestWriteUsers, ...userFormVersions[i].write_users]);
                latestWriteUsers = Array.from(uniqueWriteUsers);
            }
        }
    }

    try{
        var formToSave = req.body;
        var a = new JSDOM(formToSave.formContent);
        var rootElement = a.window.document.querySelector('.drop-container');
        var jsonArray = [];
        var b = await htmlToJson(rootElement);
        jsonArray.push(b);

        if(!formToSave){
            res.send({ status_code: 1 });
        } else {
            const filledOutDocument = {
                form_name: currentForm.form_name,
                form_control_number: currentForm.form_control_number,
                form_content: jsonArray,
                form_version: currentForm.form_version,
                form_status: currentForm.form_status,// add function to identify form type from ongoing to submitted
                shared_status: latestSharedStatus,
                date_saved: getDateNow(),
                time_saved: getTimeNow(),
                user_version: latestUserVersion + 1,
                form_owner: req.session.userEmpID,
                read_users: latestReadUsers,
                write_users: latestWriteUsers
            };

            const result = await filledoutforms.insertOne(filledOutDocument);

            userFormVersions = await filledoutforms.find({ form_control_number : selectedFormControlNumberToView,  form_owner: req.session.userEmpID}).toArray();

            for(i=0; i < userFormVersions.length; i++){
                if(userFormVersions[i].user_version >= initialUserVersion){
                    allUserFormVersions.push(userFormVersions[i].user_version);
                }
            }
            res.send({ status_code : 0, allUserFormVersions : allUserFormVersions });
        }
    } catch (error) {
        logStatus("There is an error at save filled out form: " + error);
    }
});

app.get('/formview/:form_control_number', async function (req, res){
    req.session.form_control_number = req.params.form_control_number;

    currentUserFiles = await getFiles(req.session.userEmpID);
    currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
    currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
    currentUserNotifications = await getNotifications(req.session.userEmpID);
    currentUserPicture = await getUserPicture(req.session.userEmpID);
    retrievedUserEmails = await getUsersEmails();

    var retrievedUserEmails;
    var selectedFormControlNumberToView = req.params.form_control_number;
    formVersions = await forms.find({ form_control_number : selectedFormControlNumberToView }).toArray();
    var allVersions = await filledoutforms.find({ form_control_number : selectedFormControlNumberToView }).toArray();
    var latestVersion = 0;
    var latestUserVersion = 0;

    for(i=0; i < formVersions.length; i++){
        if(formVersions[i].form_version >= latestVersion){
            latestVersion = formVersions[i].form_version;
        }
    }

    var currentForm = await forms.findOne({ form_control_number : selectedFormControlNumberToView, form_version: latestVersion });
    var userFormVersions = await filledoutforms.find({ form_control_number : selectedFormControlNumberToView,  form_owner: req.session.userEmpID}).toArray();
    var latestUserForm;
    var jsonObject;

    if(currentUserDetailsBlock.userLevel == "Secretary"){
        jsonObject = currentForm;
    }else if(currentUserDetailsBlock.userLevel == "Department Head"){
        jsonObject = currentForm;
    }else{
        if(userFormVersions == 0){
            //save latest verion as user version0 to filled out forms
            jsonObject = currentForm;
            const filledOutDocument = {
                form_name: currentForm.form_name,
                form_control_number: currentForm.form_control_number,
                form_content: currentForm.form_content,
                form_version: currentForm.form_version,
                form_status: "On-going",
                shared_status: Boolean(currentForm.shared_status),
                date_saved: getDateNow(),
                time_saved: getTimeNow(),
                user_version: 0,
                form_owner: req.session.userEmpID
            };

            const result = await filledoutforms.insertOne(filledOutDocument);
        }else{
            for(i = 0; i < userFormVersions.length; i++){
                if(userFormVersions[i].user_version >= latestUserVersion){
                    latestUserVersion = userFormVersions[i].user_version;
                }
            }
            latestUserFilledVersion = await filledoutforms.findOne({ form_control_number : selectedFormControlNumberToView, user_version: latestUserVersion });

            jsonObject = latestUserFilledVersion;

            if(currentForm.form_version != latestUserFilledVersion.form_version){
                jsonObject.form_content = await updateToLatestVersion(currentForm.form_content, latestUserFilledVersion.form_content);
            }
        }
    }


    console.log("This is the json object: " + jsonObject);
    var e = jsonObject.form_content;
    var g = await jsonToHTML(e);
    jsonObject.form_content = g;

    res.render('formview', {
        title: 'View Forms',
        retrievedUserEmails : retrievedUserEmails,
        currentUserDetailsBlock : currentUserDetailsBlock,
        currentUserFiles: currentUserFiles,
        currentUserPrivileges: currentUserPrivileges,
        currentUserNotifications: currentUserNotifications,
        currentForm: jsonObject,
        currentUserPicture: currentUserPicture,
        allVersions: allVersions,
        min_idleTime: min_idleTime
    });
});

app.put('/shareform', async function(req, res){
    try {
        var formData = req.body;
        var selectedFormControlNumberToView = formData.formControlNumber;
        var formVersions = await forms.find({ form_control_number : selectedFormControlNumberToView }).toArray();
        var latestVersion = 0;

        for(i=0; i < formVersions.length; i++){
            if(formVersions[i].form_version >= latestVersion){
                latestVersion = formVersions[i].form_version;
            }
        }

        if(!formData.shareTo){
            res.send({status_code : 1});
        } else {
            if(formData.sharedUserPrivileges == 'Viewer'){
                const result = await filledoutforms.findOneAndUpdate(
                    { form_control_number : selectedFormControlNumberToView, form_version : latestVersion },
                    { $addToSet: { "read_users" : formData.shareTo } },
                    { returnNewDocument : true }
                );

                const secondresult = await notifications.insertOne({
                    sender: req.session.userEmpID,
                    receiver: formData.shareTo,
                    time_sent: getTimeNow(),
                    date_sent: getDateNow(),
                    status: "Unseen",
                    link: "Sample Link"
                });

                res.send({ status_code: 0 });
            } else if (formData.sharedUserPrivileges == 'Editor') {
                const result = await filledoutforms.findOneAndUpdate(
                    { form_control_number : selectedFormControlNumberToView, form_version : latestVersion },
                    { $addToSet: { "write_users" : formData.shareTo } },
                    { returnNewDocument : true }
                );

                const secondresult = await notifications.insertOne({
                    sender: req.session.userEmpID,
                    receiver: formData.shareTo,
                    time_sent: getTimeNow(),
                    date_sent: getDateNow(),
                    status: "Unseen",
                    link: "Sample Link"
                });

                res.send({ status_code: 0 });
            } else {
                if(debug_mode){
                    logStatus("Could not insert shared user.");
                }
                res.send({ status_code: 2 });
            }
        }
    } catch(error) {
        logStatus("Error at share form POST: " + error);
    }
});

app.get('/viewformtemplate/:form_control_number', async function (req, res){
    var selectedFormControlNumberToView = req.params.form_control_number;
    formVersions = await forms.find({ form_control_number : selectedFormControlNumberToView }).toArray();
    var allVersions = await forms.find({ form_control_number : selectedFormControlNumberToView }).toArray();
    var latestVersion = 0;

    for(i=0; i < formVersions.length; i++){
        if(formVersions[i].form_version >= latestVersion){
            latestVersion = formVersions[i].form_version;
        }
    }

    try{
        var currentForm;

        currentUserFiles = await getFiles(req.session.userEmpID);
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);
        currentForm = await forms.findOne({ form_control_number: selectedFormControlNumberToView, form_version: latestVersion });
        currentUserPicture = await getUserPicture(req.session.userEmpID);

        //--
        //let jsonObject = JSON.parse(currentForm);
        let jsonObject = currentForm;
        var e = jsonObject.form_content;
        var g = await jsonToHTML(e);
        try{
            // console.log("hindi nag error");
            // console.log(g);
            //console.log(jsonObject.form_content );
            jsonObject.form_content = g;


            //updatedJsonString = JSON.stringify(jsonObject);
        }catch{
            console.log('NAG ERROR NA NANG SOBRA')
        }
        //--

        res.render('viewformtemplate', {
            title: 'View Forms',
            currentUserDetailsBlock : currentUserDetailsBlock,
            currentUserFiles: currentUserFiles,
            currentUserPrivileges: currentUserPrivileges,
            currentUserNotifications: currentUserNotifications,
            currentForm: jsonObject,
            currentUserPicture: currentUserPicture,
            allVersions: allVersions,
            min_idleTime: min_idleTime
        });

    }catch(error){
        logStatus("Error at viewformtemplate with controlnumber: " + error);
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
            currentUserPicture = await getUserPicture(req.session.userEmpID);

            res.render('index', {
                title: 'Home Page',
                currentUserDetailsBlock: currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                currentUserPicture: currentUserPicture,
                min_idleTime: min_idleTime
            });
        }

    } catch (error) {
        logStatus("Error at index: " + error);
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
            currentUserPicture = await getUserPicture(req.session.userEmpID);

            res.render('accountsettings', {
                title: 'Account Settings',
                currentUserDetailsBlock: currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                currentUserPicture: currentUserPicture,
                min_idleTime: min_idleTime
            });
        }

    } catch (error) {
        logStatus("Error at account settings: " + error);
    }
});

app.post('/', upload.single('file'), async function (req, res) {
    const uploadedFile = req.file;

    if(debug_mode){
        logStatus("Received file: " + req.file);
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
                logStatus("Saved file in database : " + uploadInfo);
            }

            const documents = await getFiles(req.session.userEmpID);

            res.json({documents});
        } catch(error){
            logStatus("Error at index post upload file: " + error);
        }
    }
});

app.delete('/ajaxdelete/:file_name', async function (req, res) {

    var selectedFileForDeletion = req.params.file_name;

    if(debug_mode){
        logStatus("No file being selected to delete: " + selectedFileForDeletion);
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
                logStatus("Error deleting file:" + err);
            }
        } else {
            if(debug_mode){
                logStatus("File deleted successfully.");
            }
        }
    });

    const deleteCriteria = {file_name: selectedFileForDeletion, uploadedBy: req.session.userEmpID};

    await files.deleteOne(deleteCriteria, function (err, result) {
        if (err) {
            if(debug_mode){
                logStatus("Error deleting file:" + err);
            }
        } else {
            if(debug_mode){
                logStatus("File deleted successfully.")
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
        logStatus("User Reseated");
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
            logStatus("Error at Login: " + error);
        }
    }
});

app.get('/aboutUs', async function(req, res){
    try {
        if (req.session.loggedIn) {
            res.redirect('/');
        } else {
            res.render('aboutUs', {
                title: 'About Us'
            });
        }
    } catch (error){
        if(debug_mode){
            logStatus("Error at about us: " + error);
        }
    }
});

app.get('/techSupport', async function(req, res){
    try {
        if (req.session.loggedIn) {
            res.redirect('/');
        } else {
            res.render('techSupport', {
                title: 'Tech Support'
            });
        }
    } catch (error){
        if(debug_mode){
            logStatus("Error at tech support: " + error);
        }
    }
});

app.get('/ourTeam', async function(req, res){
    try {
        if (req.session.loggedIn) {
            res.redirect('/');
        } else {
            res.render('ourTeam', {
                title: 'Our Team'
            });
        }
    } catch (error){
        if(debug_mode){
            logStatus("Error at our team: " + error);
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
                    logStatus("Cannot find user");
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
                currentUserPicture = await getUserPicture(req.session.userEmpID);

                res.render('index', {
                    title: 'Home Page',
                    currentUserDetailsBlock: currentUserDetailsBlock,
                    currentUserFiles: currentUserFiles,
                    currentUserPrivileges: currentUserPrivileges,
                    currentUserNotifications: currentUserNotifications,
                    currentUserPicture: currentUserPicture,
                    min_idleTime: min_idleTime
                });

                if(debug_mode){
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
    var requiredPrivilege = 'Manage Templates';
    var accessGranted = false;

    if (req.session.loggedIn) {
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);
        currentUserPicture = await getUserPicture(req.session.userEmpID);
        currentUserWidgets = await getWidgets(req.session.userEmpID);
        accessGranted = validateAction(currentUserPrivileges, requiredPrivilege);

        if(accessGranted){
            res.render('createform', {
                title: 'Create Form',
                currentUserDetailsBlock : currentUserDetailsBlock,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                currentUserPicture: currentUserPicture,
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

app.get('/createwidget', async function(req, res){
    var requiredPrivilege = 'Manage Templates';
    var accessGranted = false;

    if (req.session.loggedIn) {
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);
        currentUserPicture = await getUserPicture(req.session.userEmpID);
        accessGranted = validateAction(currentUserPrivileges, requiredPrivilege);

        if(accessGranted){
            res.render('createwidget', {
                title: 'Create Widget',
                currentUserDetailsBlock : currentUserDetailsBlock,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                currentUserPicture: currentUserPicture,
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

function getUniqueForms(formsGroup){
    var uniqueForms = [];
    var seenControlNumber = {};

    for (const obj of formsGroup) {
        if (!seenControlNumber[obj.form_control_number]) {
            seenControlNumber[obj.form_control_number] = true;
            uniqueForms.push(obj);
        }
    }
    return uniqueForms;
}

app.get('/viewforms', async function(req, res){
    var requiredPrivilege = 'View Forms Only';
    var accessGranted = false;

    if (req.session.loggedIn) {
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);
        currentUserForms = await getUserForms(req.session.userEmpID);
        currentUserPicture = await getUserPicture(req.session.userEmpID);

        accessGranted = validateAction(currentUserPrivileges, requiredPrivilege);

        if(accessGranted){
            var allPublishedForms = await forms.find({ form_status : "Published" }).toArray();
            console.log("This are all the published forms: " + JSON.stringify(allPublishedForms));
            var allAssignedForms = await forms.find({ assigned_users : req.session.userEmpID }).toArray();
            console.log("This are all the assigned forms: " + JSON.stringify(allAssignedForms));
            var allSharedForms = await forms.find({
                $or: [
                    { read_users : req.session.userEmpID },
                    { write_users : req.session.userEmpID }
                ]
            }).toArray();
            console.log("This are all the shared forms: " + JSON.stringify(allSharedForms));

            var publishedForms = getUniqueForms(allPublishedForms);
            var assignedForms = getUniqueForms(allAssignedForms);
            var sharedForms = getUniqueForms(allSharedForms);

            res.render('viewforms', {
                title: 'View Forms',
                currentUserDetailsBlock : currentUserDetailsBlock,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                publishedForms: publishedForms,
                assignedForms: assignedForms,
                sharedForms: sharedForms,
                currentUserPicture: currentUserPicture,
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
    var requiredPrivilege = 'Manage Templates';
    var accessGranted = false;

    if (req.session.loggedIn) {
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);
        currentForms = await getForms(req.session.userEmpID);
        currentUserPicture = await getUserPicture(req.session.userEmpID);

        accessGranted = validateAction(currentUserPrivileges, requiredPrivilege);

        if(accessGranted){
            res.render('viewformtemplates', {
                title: 'View Form Templates',
                currentUserDetailsBlock : currentUserDetailsBlock,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                currentForms: currentForms,
                currentUserPicture: currentUserPicture,
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
        currentUserPicture = await getUserPicture(req.session.userEmpID);

        res.render('submissions', {
            title: 'Submissions',
            currentUserDetailsBlock : currentUserDetailsBlock,
            currentUserFiles: currentUserFiles,
            currentUserPrivileges: currentUserPrivileges,
            currentUserNotifications: currentUserNotifications,
            currentUserPicture: currentUserPicture,
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
        currentUserPicture = await getUserPicture(req.session.userEmpID);

        accessGranted = validateAction(currentUserPrivileges, requiredPrivilege);

        if(accessGranted){
            res.render('viewreports', {
                title: 'View Reports',
                currentUserDetailsBlock : currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                currentUserPicture: currentUserPicture,
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
        currentUserPicture = await getUserPicture(req.session.userEmpID);

        res.render('managenotifications', {
            title: 'Manage Notifications',
            currentUserDetailsBlock : currentUserDetailsBlock,
            currentUserFiles: currentUserFiles,
            currentUserPrivileges: currentUserPrivileges,
            currentUserNotifications: currentUserNotifications,
            currentUserPicture: currentUserPicture,
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
        currentUserPicture = await getUserPicture(req.session.userEmpID);

        res.render('managedeadlines', {
            title: 'Manage Deadlines',
            currentUserDetailsBlock: currentUserDetailsBlock,
            currentUserFiles: currentUserFiles,
            currentUserPrivileges: currentUserPrivileges,
            currentUserNotifications: currentUserNotifications,
            currentUserPicture: currentUserPicture,
            min_idleTime: min_idleTime
        });
    } else {
        res.redirect('login');
    }
});

app.get('/createusers', async function(req, res){
    var requiredPrivilege = 'User Management';
    var accessGranted = false;

    if (req.session.loggedIn) {
        currentUserFiles = await getFiles(req.session.userEmpID);
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);
        currentUserPicture = await getUserPicture(req.session.userEmpID);

        accessGranted = validateAction(currentUserPrivileges, requiredPrivilege);

        if(accessGranted) {
            res.render('createusers', {
                title: 'Create Users',
                currentUserDetailsBlock: currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                currentUserPicture: currentUserPicture,
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
        var email = req.body.eMail;

        try {
            const existingUser = await db.collection('users').findOne({ username: username });
            if(existingUser) {
                if(debug_mode){
                    logStatus("User already exists!");
                }
            } else {
                const newUser = {
                    "email": email,
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
    var requiredPrivilege = 'User Management';
    var accessGranted = false;

    if (req.session.loggedIn) {
        currentUserFiles = await getFiles(req.session.userEmpID);
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);
        currentUserPicture = await getUserPicture(req.session.userEmpID);

        accessGranted = validateAction(currentUserDetailsBlock, requiredPrivilege);

        if(accessGranted){
            res.render('manageuserroles', {
                title: 'Manage User Roles',
                currentUserDetailsBlock: currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                currentUserPicture: currentUserPicture,
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
    var requiredPrivilege = 'User Management';
    var accessGranted = false;

    if (req.session.loggedIn) {
        currentUserFiles = await getFiles(req.session.userEmpID);
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);
        currentUserPicture = await getUserPicture(req.session.userEmpID);

        accessGranted = validateAction(currentUserPrivileges, requiredPrivilege);

        if(accessGranted){
            res.render('manageusersettings', {
                title: 'Manage User Settings',
                currentUserDetailsBlock: currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                currentUserPicture: currentUserPicture,
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
    var requiredPrivilege = 'View Users';
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
        currentUserPicture = await getUserPicture(req.session.userEmpID);

        accessGranted = validateAction(currentUserPrivileges, requiredPrivilege);

        if(accessGranted){
            res.render('viewusers', {
                title: 'View Users',
                currentUserDetailsBlock: currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                min_idleTime: min_idleTime,
                currentUserPicture: currentUserPicture,
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
            logStatus("Error at viewing users: " + error);
        }

        res.status(500).send('Internal Server Error');
    }
});

app.post('/accountsettings', pictureUpload.single('file'), async function (req, res) {
    const uploadedPicture = req.file;

    if (debug_mode) {
        logStatus("Received file: " + req.file);
    }

    if (!uploadedPicture) {
        if(debug_mode){
            logStatus("No file Uploaded");
        }

    } else {
        const { originalname } = uploadedPicture;
        var uploadedPictureDirectory = "";
        if(debug_mode){
            logStatus("File Uploaded Successfully in " + `/views/profile_pictures/${currentUserDetailsBlock.firstName}/${originalname}`);
        }

        try{
            var picture = await users.findOne({ emp_id: req.session.userEmpID });
            if (picture.user_picture == '' || picture.user_picture == null || picture.user_picture == undefined){
                userPicture = users.findOneAndUpdate(
                    { "emp_id": currentUserDetailsBlock.empID },
                    { $set: { "user_picture": "/profile_pictures/" + req.session.userEmpID + "/" + originalname } },
                    { returnNewDocument: true }
                )
            } else {
                fs.unlink("./views/" + picture.user_picture, function (error){
                    if (debug_mode) {
                       logStatus("Failed to Remove Previous Profile Picture " + error);
                    }
                });
                userPicture = users.findOneAndUpdate(
                    { "emp_id": currentUserDetailsBlock.empID },
                    { $set: { "user_picture": "/profile_pictures/" + req.session.userEmpID + "/" + originalname } },
                    { returnNewDocument: true }
                )
            }

            uploadedPictureDirectory = users.user_picture;
            if(debug_mode){
                logStatus("Picture saved in database: " + uploadedPictureDirectory);
            }

            res.json({uploadedPictureDirectory});
        } catch(error){
            logStatus(error);
        }
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
            logStatus(error);
        }
    }
});

app.post('/update-Password', async function(req, res){
    if(req.session.loggedIn) {

        const currentUserPassword = req.body.currentPassword;
        const newUserPassword = req.body.newPassword;

        try{
            var currentUser = await users.findOne({ emp_id: req.session.userEmpID });

            if(currentUserPassword === currentUser.password){
                if(newUserPassword !== currentUser.password){
                    const updatedPassword = await users.findOneAndUpdate(
                        { emp_id : currentUser.emp_id },
                        { $set: { password: newUserPassword } },
                        { returnNewDocument: false }
                        );
                    if(debug_mode){
                        logStatus("Password of " + currentUser.emp_id + " was updated.");
                    }
                    res.send({status_code: 0});
                } else {
                    if(debug_mode){
                        logStatus("New password should not be the same as your current password.");
                    }
                    res.send({status_code: 1})
                }
            } else {
                if(debug_mode){
                    logStatus("Current password is incorrect.");
                }
                res.send({status_code: 2});
            }
        } catch(error){
            logStatus("Failed updating password " + error);
        }
    } else {
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/AJAX_assignUsers', async function(req, res){
    if(req.session.loggedIn){
        var formData = req.body;
        var selectedFormControlNumberToView = formData.formControlNumber;
        allForms = await forms.find({ form_control_number : selectedFormControlNumberToView }).toArray();

        try {
            for( i = 0; i < allForms.length; i++) {
                if(allForms[i].form_control_number == selectedFormControlNumberToView) {
                    updateDocument = await forms.updateMany(
                        { form_control_number : selectedFormControlNumberToView },
                        { $addToSet: { "assigned_users" : formData.assignedUser } }
                    );
                    res.send({ status_code : 0 });
                } else {
                    res.send({ status_code : 1 });
                }
            }
        } catch(error) {
            if(debug_mode) {
                logStatus('There was an error at AJAX function in assigning users.');
            }
            res.send({ status_code : 2 });
        }

    } else {
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/AJAX_togglePublish', async function(req, res) {
    if(req.session.loggedIn) {
        var formData = req.body;
        var selectedFormControlNumberToView = formData.formControlNumber;
        formVersions = await forms.find({ form_control_number : selectedFormControlNumberToView }).toArray();
        var targetedVersion = parseInt(formData.targetedVersion, 10);

        var currentStatus;
        var updateDocument;
        var updatedStatus;
        var successfulWow = false;
        try{
            for(i=0; i < formVersions.length; i++){
                if(formVersions[i].form_version == targetedVersion){
                    currentStatus = formVersions[i].form_status;
                    console.log("the found status of : " + targetedVersion + "is : " + currentStatus);

                    if(currentStatus == "Template"){
                        try {
                            console.log("Entering the setting of Status");
                            updateDocument = await forms.findOneAndUpdate(
                                { form_control_number : selectedFormControlNumberToView, form_version : targetedVersion },
                                { $set: { form_status: "Published" } }
                            );
                            updatedStatus = "Published";
                            console.log("Finished the setting of Status");
                        } catch(error) {
                            console.log("May error : " + error);
                        }

                        console.log("Setting control number : " + selectedFormControlNumberToView + " with version " + targetedVersion + " to Published");
                    }else{
                        updateDocument = await forms.findOneAndUpdate(
                            { form_control_number : selectedFormControlNumberToView, form_version : targetedVersion },
                            { $set: { form_status: "Template" } }
                        );
                        updatedStatus = "Template";
                        console.log("Setting control number : " + selectedFormControlNumberToView + " with version " + targetedVersion + " to Template");
                    }
                }
            }

            if(currentStatus == "Template"){
                for(i=0; i < formVersions.length; i++){
                    if(formVersions[i].form_version != targetedVersion){
                        updateDocument = await forms.findOneAndUpdate(
                            { form_control_number : selectedFormControlNumberToView, form_version : formVersions[i].form_version },
                            { $set: { form_status: "Template" } }
                        );
                    }
                }
            }

            successfulWow = true;
        }catch(error){
            successfulWow = false;
        }


        try{
            if(!successfulWow){
                if(debug_mode){
                    logStatus('There was an error in AJAX Toggle Publish: ' + error);
                }
                res.send({ status_code : 1 });
            } else {
                res.send({ status_code : 0 , updatedStatus : updatedStatus});
            }
        } catch(error) {
            if(debug_mode){
                logStatus('There was an error in AJAX Toggle Publish: ' + error);
            }
        }

    } else {
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/AJAX_toggleAllowFileUpload', async function(req, res) {
    if(req.session.loggedIn) {
        var formData = req.body;
        var selectedFormControlNumberToView = formData.formControlNumber;
        formVersions = await forms.find({ form_control_number : selectedFormControlNumberToView }).toArray();

        var currentStatus;
        var updateDocument;
        var updatedStatus;
        var successfulWow = false;
        try{
            for(i=0; i < formVersions.length; i++){
                currentStatus = formVersions[i].allow_file_upload;

                if(currentStatus == false){
                    try {
                        console.log("Entering the setting of Status");
                        updateDocument = await forms.updateMany(
                            { form_control_number : selectedFormControlNumberToView },
                            { $set: { allow_file_upload: true } }
                        );
                        updatedStatus = "Allowed";
                        console.log("Finished the setting of Status");
                    } catch(error) {
                        console.log("May error : " + error);
                    }

                }else{
                    updateDocument = await forms.updateMany(
                        { form_control_number : selectedFormControlNumberToView },
                        { $set: { allow_file_upload: false } }
                    );
                    updatedStatus = "Not Allowed";
                }

            }

            successfulWow = true;
        }catch(error){
            successfulWow = false;
        }


        try{
            if(!successfulWow){
                if(debug_mode){
                    logStatus('There was an error in AJAX Toggle Publish: ' + error);
                }
                res.send({ status_code : 1 });
            } else {
                res.send({ status_code : 0 , updatedStatus : updatedStatus});
            }
        } catch(error) {
            if(debug_mode){
                logStatus('There was an error in AJAX Toggle Publish: ' + error);
            }
        }

    } else {
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/AJAX_toggleSharing', async function(req, res) {
    if(req.session.loggedIn) {
        var formData = req.body;
        var selectedFormControlNumberToView = formData.formControlNumber;
        formVersions = await forms.find({ form_control_number : selectedFormControlNumberToView }).toArray();

        var currentStatus;
        var updateDocument;
        var updatedStatus;
        var successfulWow = false;

        try{
            for(i = 0; i < formVersions.length; i++){
                currentStatus = formVersions[i].shared_status;

                if(currentStatus == false){
                    try{
                        updateDocument = await forms.updateMany(
                            { form_control_number : selectedFormControlNumberToView },
                            { $set: { shared_status: true } }
                        );
                        updatedStatus = "Allowed";
                    } catch(error) {
                        console.log("May error : " + error);
                    }
                } else {
                    updateDocument = await forms.updateMany(
                        { form_control_number : selectedFormControlNumberToView },
                        { $set: { shared_status: false } }
                    );
                    updatedStatus = "Not Allowed";
                }
            }

            successfulWow = true;
        } catch(error) {
            successfulWow = false;
        }

        try{
            if(!successfulWow){
                if(debug_mode){
                    logStatus('There was an error in AJAX Toggle Publish: ' + error);
                }
                res.send({ status_code : 1 });
            } else {
                res.send({ status_code : 0 , updatedStatus : updatedStatus});
            }
        } catch(error) {
            if(debug_mode){
                logStatus('There was an error in AJAX Toggle Publish: ' + error);
            }
        }

    } else {
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/AJAX_viewFormVersion', async function(req, res) {
    if(req.session.loggedIn){
        var formData = req.body;
        var currentForm = await forms.findOne({ form_control_number: formData.formControlNumber, form_version: parseInt(formData.versionChoice, 10) });
        console.log("This is the current form: " + currentForm);
        if(!currentForm){
            if(debug_mode){
                logStatus("Could not find the form.");
            }
            res.send({ status_code : 1 });
        } else {
            let jsonObject = currentForm;
            var e = jsonObject.form_content;
            var g = await jsonToHTML(e);

            try{
                jsonObject.form_content = g;
                res.send({ status_code : 0, formContent : jsonObject.form_content, formStatus : currentForm.form_status, sharedStatus : currentForm.shared_status, formVersion : currentForm.form_version });
            } catch(error) {
                if(debug_mode){
                    logStatus("Error at view form version for front end: " + error);
                }
            }
        }

    } else {
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/AJAX_formUserViewVersion', async function(req, res) {
    if(req.session.loggedIn){
        var formData = req.body;
        var currentUserForm = await filledoutforms.findOne({ form_control_number: formData.formControlNumber, user_version: parseInt(formData.userVersionChoice, 10) });
        console.log("This is the current form: " + currentUserForm);
        if(!currentUserForm){
            if(debug_mode){
                logStatus("Could not find the form.");
            }
            res.send({ status_code : 1 });
        } else {
            let jsonObject = currentUserForm;
            var e = jsonObject.form_content;
            var g = await jsonToHTML(e);

            try{
                jsonObject.form_content = g;
                res.send({ status_code : 0, formContent : jsonObject.form_content });
            } catch(error) {
                if(debug_mode){
                    logStatus("Error at view form version for front end: " + error);
                }
            }
        }

    } else {
        res.render('login', {
            title: 'Login Page'
        });
    }
});

async function getUserPicture(empID){
    var userPicture;

    try{
        userPicture = await users.findOne({ emp_id: empID });

        if(debug_mode){
            logStatus("The picture is this: " + JSON.stringify(userPicture));
        }
    } catch (error){
        if(debug_mode){
            logStatus("Failed to retrieve user picture " + error);
        }
        throw error;
    }
    return userPicture;
}

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

async function getUserForms(empID){
    var userFormsCollections;
    try {
        userFormsCollections = await filledoutforms.find().toArray();

        if(debug_mode){
            logStatus("The array forms at function getForms() : " + JSON.stringify(userFormsCollections));
        }
    } catch (error) {
        userFormsCollections = [];
        if(debug_mode){
            logStatus("Failed to retrieve forms: " + error);
        }
    }
    return userFormsCollections;
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

async function getWidgets(empID){
    var widgetsCollections;
    try {
        widgetsCollections = await widgets.find().toArray();

        if(debug_mode){
            logStatus("The array forms at function getWidgets() : " + JSON.stringify(widgetsCollections));
        }
    } catch (error) {
        widgetsCollections = [];
        if(debug_mode){
            logStatus("Failed to retrieve forms: " + error);
        }
    }
    return widgetsCollections;
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
            logStatus("Found all users: " + JSON.stringify(documents)); //stringified for logging purposes only
        }

        return documents;
    } catch (error) {

        if(debug_mode){
            logStatus("Error at getting users: " + error);
        }

    }
}

async function getUsersEmails() {
    var userName;
    var empEmails = [];
    try{
        userName = await users.find({}).toArray();

        for (const user of userName) {
            empEmails.push(user.emp_id);
        }

        logStatus("This are the user names: " + JSON.stringify(empEmails));
        return empEmails;
    } catch(error) {
        logStatus("There is an error retrieving the user names: " + error);
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

async function updateToLatestVersion(latestFormTemplate, latestFilledOutForm) {
    for(const key in latestFilledOutForm){
        if(latestFilledOutForm.hasOwnProperty(key)){
            if(typeof latestFilledOutForm[key] === 'object') {
                if(latestFormTemplate[key]){
                    latestFormTemplate[key] = await updateToLatestVersion(latestFormTemplate[key], latestFilledOutForm[key]);
                }
            }else{
                if(latestFormTemplate[key] === undefined || latestFormTemplate[key] === null || latestFormTemplate[key] === ""){
                    latestFormTemplate[key] = latestFilledOutForm[key];
                }
            }
        }
    }

    return latestFormTemplate;
}
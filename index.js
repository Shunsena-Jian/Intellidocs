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

var configMinimumHandlingTime = config.min_idleTime;
if(configMinimumHandlingTime < 60000){
    configMinimumHandlingTime = 60000;
}
const min_idleTime = configMinimumHandlingTime;

const server = http.createServer(app);
const io = socketIo(server);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use('/views/src', express.static(path.join(__dirname, 'views', 'src')));
app.use(express.static(path.join(__dirname, 'views')));
app.use('/uploads', express.static('uploads'));
//app.use((req, res, next) => {
//    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
//    next();
//});

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

server.listen(port, () =>{
    console.log("Server started \nPort: " + port + "\nDebug mode: " + debug_mode + "\nMinimum User idle time: " + min_idleTime);
});

io.on('connection', (socket) =>{

    socket.on('manualPing', (data) =>{
        console.log('Received client ping:', data);
        socket.emit('manualPong', 'Server received: ' + data);
    });

    socket.on('disconnect', () =>{
    });
});

const storage = multer.diskStorage({
    destination: function (req, file, cb){
        const uploadDirectory = 'uploads/' + req.session.userEmpID;
        fs.mkdirSync(uploadDirectory, { recursive: true });
        cb(null, uploadDirectory);
    },
    filename: function (req, file, cb){
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

const pictureStorage = multer.diskStorage({
    destination: function (req, file, cb){
        const uploadDirectory = 'views/profile_pictures/' + req.session.userEmpID;
        fs.mkdirSync(uploadDirectory, { recursive: true });
        cb(null, uploadDirectory);
    },
    filename: function (req, file, cb){
        cb(null, file.originalname);
    }
});

const pictureUpload = multer({ storage: pictureStorage });

app.get('/deletefile/:file_name', function(req, res){
    if(req.session.loggedIn){
        var selectedFileForDeletion = req.params.file_name;

        logStatus("No file being deleted get delete file function: " + selectedFileForDeletion);

        function deleteFile(filePath, callback){
            fs.unlink(filePath, function (error){
                if(error){
                    logError(error);
                    callback(error);
                }else{
                    callback(null);
                }
            });
        }

        var filePathToDelete = "uploads/" + req.session.userEmpID + "/"  + selectedFileForDeletion;

        deleteFile(filePathToDelete, function (error){
            if(error){
                logError("Error deleting file:" + error);
            }else{
                logStatus("File deleted successfully.");
            }
        });

        const deleteCriteria = {file_name: selectedFileForDeletion, uploadedBy: req.session.userEmpID};

        files.deleteOne(deleteCriteria, function (error, result){
            if(error){
                logError("Error deleting document:" + error);
            }else{
               logStatus("Document deleted successfully.")
            }
        });
        res.redirect('/');
    } else {
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.get('/downloadfile/:file_name/:file_owner', function(req, res){
    if(req.session.loggedIn){
        try{
            var selectedFileForDownload = req.params.file_name;
            var selectedUser = req.params.file_owner;
            console.log("This is the one: " + selectedUser);
            logStatus("User entered download request: " + selectedFileForDownload);

            res.download("./uploads/" + selectedUser + "/" + selectedFileForDownload);
        }catch(error){
            logError("Error at downloading file: " + error);
        }
    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

//ENGINE
//-------------------------HTML TO JSON
async function htmlToJson(element){
    const jsonElementFormat = {
        ele_type: element.nodeName ? element.nodeName.toLowerCase() : 'unknown',
        ele_attributes: {
            key: null,
        },
        ele_contents: [],
    };

    if(element.attributes){
        for (let i = 0; i < element.attributes.length; i++){
            const attr = element.attributes.item(i);
            jsonElementFormat.ele_attributes[attr.name] = attr.value;
        }
    }

    if(element.childNodes){
        for(let i = 0; i < element.childNodes.length; i++){
            const childNode = element.childNodes[i];
            if(childNode.nodeType === 1){
                const childJson = await htmlToJson(childNode);
                jsonElementFormat.ele_contents.push(childJson);
            }else if (childNode.nodeType === 3){
                const trimmedText = childNode.textContent.trim();
                if(trimmedText !== ''){
                    jsonElementFormat.ele_contents.push(trimmedText);
                }
            }
        }
    }
    return jsonElementFormat;
}

//-------------------------JSON TO HTML

async function jsonToHTML(jsonDataArray, indentLevel = 0){
    const selfClosingTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    const indent = '    '.repeat(indentLevel);

    let html = '';

    for(const jsonData of jsonDataArray){
        html += `${indent}<${jsonData.ele_type}`;

        for(const [attributeName, attributeValue] of Object.entries(jsonData.ele_attributes)){
            html += ` ${attributeName}="${attributeValue}"`;
        }

        const isSelfClosing = selfClosingTags.includes(jsonData.ele_type);

        if(isSelfClosing){
            html += '>\n';
        }else{
            html += '>\n';

        if(jsonData.ele_contents){
            for(const child of jsonData.ele_contents){
                if (typeof child === 'object') {
                    html += await jsonToHTML([child], indentLevel + 1);
                } else {
                    html += `${'    '.repeat(indentLevel + 1)}${child}\n`;
                }
            }
        }

        html += `${indent}</${jsonData.ele_type}>\n`;
        }
    }

    return html;
}

//END OF ENGINE

app.post('/savecreatedform', async function(req, res){
    if(req.session.loggedIn){
        try{
            var latestForm;
            var currentDate = new Date();
            var date = currentDate.toDateString();
            var time = currentDate.toTimeString().split(' ')[0];
            var formData = req.body;

            var jsonArray = [];

            jsonArray.push(formData.formContent);
            latestForm = await forms.findOne({ form_name : formData.name });

            if(latestForm && formData.name === latestForm.form_name){
                res.json({ status_code : 1 });
            }else{
                const formDocument = {
                    form_name: formData.name,
                    form_control_number: formData.formControlNumber.toString(),
                    form_content: jsonArray,
                    form_version: 0,
                    form_status: formData.formStatus,
                    shared_status: false,
                    allow_file_upload: false,
                    date_saved: getDateNow(),
                    time_saved: getTimeNow(),
                    assigned_users: [],
                    due_date: null,
                    quarter_due_date: null,
                    annual_due_date: null,
                    academic_year: null,
                    semester: null
                };

                const result = await forms.insertOne(formDocument);
                logStatus("Created form saved at database: " + result);
                res.json({ success: true });
            }
        }catch(error){
            logError("Error at saved created form: " + error);
        }
    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.post('/saveformversion', async function(req, res){
    if(req.session.loggedIn){
        var formData = req.body;
        var latestVersion = 0;
        var newVersionNumber = 0;
        var latestAssignedUsers = [];
        var formHistory = await forms.find({ form_control_number : formData.formControlNumber }).toArray();

        for(i=0; i < formHistory.length; i++){
            if(formHistory[i].form_version >= latestVersion){
                latestVersion = formHistory[i].form_version;
                latestSharedStatus = formHistory[i].form_version;
                fileUploadStatus = formHistory[i].allow_file_upload;

                latestAssignedUsers = formHistory[i].assigned_users;
                if(formHistory[i].read_users){
                    let uniqueAssignedUsers = new Set([...latestAssignedUsers, ...formHistory[i].assigned_users]);
                    latestAssignedUsers = Array.from(uniqueAssignedUsers);
                }
            }
        }
        newVersionNumber = latestVersion + 1;

        try{
            var currentDate = new Date();
            var date = currentDate.toDateString();
            var time = currentDate.toTimeString().split(' ')[0];
            var jsonArray = [];
            jsonArray.push(formData.formContent);

            const formDocument = {
                form_name: formData.name,
                form_control_number: formData.formControlNumber.toString(),
                form_content: jsonArray,
                form_version: newVersionNumber,
                form_status: formData.formStatus,
                shared_status:latestSharedStatus,
                allow_file_upload: fileUploadStatus,
                date_saved: getDateNow(),
                time_saved: getTimeNow(),
                assigned_users: latestAssignedUsers,
                due_date: formData.dueDate,
                quarter_due_date: formData.quarterDueDate,
                annual_due_date: formData.annualDueDate,
                academic_year: formData.academicYear,
                semester: formData.semester
            };

            const result = await forms.insertOne(formDocument);
            logStatus("Saved new form version in database: " + result);
            res.json({ success: true });

        }catch (error){
            logError("Error at save form version: " + error);
        }
    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.post('/savecreatedwidget', async function(req, res){
    if(req.session.loggedIn){
        try{
            var widgetData = req.body;

            const widgetDocument = {
                widget_name: widgetData.name,
                widget_category: widgetData.category,
                widget_content: widgetData.widgetContent
            };

            const result = await widgets.insertOne(widgetDocument);
            logStatus("Saved created widget in database: " + result);

        }catch(error){
            logError("Error at save created widget: " + error);
        }
        res.json({ success: true });
    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.post('/formautosave', async function (req, res){
    if(req.session.loggedIn){
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
        }catch (error){
            logError("Error at form view POST: " + error);
        }
    }else{
        res.render('login', {
            title: 'Login Page'
        });
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

app.put('/submitform', async function(req, res){
    if(req.session.loggedIn){
        var selectedFormControlNumberToView = req.session.form_control_number;
        formVersions = await forms.find({ form_control_number : selectedFormControlNumberToView }).toArray();
        var latestVersion = 0;
        var latestUserVersion = 0;
        var initialUserVersion = 0;
        var latestSharedStatus;
        var latestWriteUsers = [];
        var latestReadUsers = [];
        var userFormVersions = await filledoutforms.find({ form_control_number : selectedFormControlNumberToView,  form_owner: req.session.userEmpID}).toArray();
        var allUserFormVersions = [];

        for(i=0; i < formVersions.length; i++){
            if(formVersions[i].form_version >= latestVersion){
                latestVersion = formVersions[i].form_version;
            }
        }

        var currentForm = await forms.findOne({ form_control_number : selectedFormControlNumberToView, form_version: latestVersion });

        for(i=0; i < userFormVersions.length; i++){
            if(userFormVersions[i].user_version >= latestUserVersion){
                latestUserVersion = userFormVersions[i].user_version;
                latestSharedStatus = userFormVersions[i].shared_status;
                latestAllowFileUpload = userFormVersions[i].allow_file_upload;
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
            var formData = req.body;
            var jsonArray = [];
            jsonArray.push(formData.formContent);

            if(!formData){
                res.send({ status_code: 1 });
            }else{
                const filledOutDocument = {
                    form_name: currentForm.form_name,
                    form_control_number: currentForm.form_control_number,
                    form_content: jsonArray,
                    form_version: currentForm.form_version,
                    form_status: "Submitted",
                    shared_status: latestSharedStatus,
                    allow_file_upload: latestAllowFileUpload,
                    date_saved: getDateNow(),
                    time_saved: getTimeNow(),
                    user_version: latestUserVersion + 1,
                    form_owner: req.session.userEmpID,
                    read_users: latestReadUsers,
                    write_users: latestWriteUsers,
                    due_date: currentForm.due_date,
                    quarter_due_date: currentForm.quarter_due_date,
                    annual_due_date: currentForm.annual_due_date,
                    academic_year: currentForm.academic_year,
                    semester: currentForm.semester,
                    date_submitted: getDateNow(),
                    dean_approval: "Not Approved",
                    department_head_approval: "Not Approved",
                    secretary_approval: "Not Approved",
                };

                const result = await filledoutforms.insertOne(filledOutDocument);
                userFormVersions = await filledoutforms.find({ form_control_number : selectedFormControlNumberToView,  form_owner: req.session.userEmpID}).toArray();

                for(i=0; i < userFormVersions.length; i++){
                    if(userFormVersions[i].user_version >= initialUserVersion){
                        allUserFormVersions.push(userFormVersions[i].user_version);
                    }
                }

                var userFormTemplate = await filledoutforms.findOne({ form_control_number : selectedFormControlNumberToView,  form_owner: req.session.userEmpID, user_version: 0 });
                let jsonObject = userFormTemplate;
                var e = jsonObject.form_content;
                var g = await jsonToHTML(e);
                jsonObject.form_content = g;

                var prevSubmittedForms = await filledoutforms.find({ form_control_number : selectedFormControlNumberToView, form_owner : req.session.userEmpID, form_status : "Submitted" }).toArray();

                res.send({ status_code : 0, allUserFormVersions : allUserFormVersions, initialTemplate: jsonObject.form_content, prevSubmittedForms: prevSubmittedForms });
            }
        }catch (error){
            logError("There is an error at save filled out form: " + error);
        }
    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/savefilledoutform', async function(req, res){
    if(req.session.loggedIn){
        var selectedFormControlNumberToView = req.session.form_control_number;
        formVersions = await forms.find({ form_control_number : selectedFormControlNumberToView }).toArray();
        var latestVersion = 0;
        var latestUserVersion = 0;
        var initialUserVersion = 0;
        var latestSharedStatus;
        var latestWriteUsers = [];
        var latestReadUsers = [];
        var userFormVersions = await filledoutforms.find({ form_control_number : selectedFormControlNumberToView,  form_owner: req.session.userEmpID}).toArray();
        var allUserFormVersions = [];

        for(i=0; i < formVersions.length; i++){
            if(formVersions[i].form_version >= latestVersion){
                latestVersion = formVersions[i].form_version;
            }
        }

        var currentForm = await forms.findOne({ form_control_number : selectedFormControlNumberToView, form_version: latestVersion });

        for(i=0; i < userFormVersions.length; i++){
            if(userFormVersions[i].user_version >= latestUserVersion){
                latestUserVersion = userFormVersions[i].user_version;
                latestSharedStatus = userFormVersions[i].shared_status;
                latestAllowFileUpload = userFormVersions[i].shared_status;
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
            var formData = req.body;
            var jsonArray = [];
            jsonArray.push(formData.formContent);

            if(!formData){
                res.send({ status_code: 1 });
            }else{
                const filledOutDocument = {
                    form_name: currentForm.form_name,
                    form_control_number: currentForm.form_control_number,
                    form_content: jsonArray,
                    form_version: currentForm.form_version,
                    form_status: currentForm.form_status,
                    shared_status: latestSharedStatus,
                    allow_file_upload: latestAllowFileUpload,
                    date_saved: getDateNow(),
                    time_saved: getTimeNow(),
                    user_version: latestUserVersion + 1,
                    form_owner: req.session.userEmpID,
                    read_users: latestReadUsers,
                    write_users: latestWriteUsers,
                    due_date: currentForm.due_date,
                    quarter_due_date: currentForm.quarter_due_date,
                    annual_due_date: currentForm.annual_due_date,
                    academic_year: currentForm.academic_year,
                    semester: currentForm.semester,
                    dean_approval: "Not Approved",
                    department_head_approval: "Not Approved",
                    secretary_approval: "Not Approved",
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
        }catch (error){
            logError("There is an error at save filled out form: " + error);
        }
    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.get('/sharedview', async function (req, res){
    if(req.session.loggedIn){
        var sharedFormControlNumber = req.session.form_control_number;
        var sharedFormOwner = req.session.form_owner;
        var retrievedUserEmails;
        var jsonObject;

        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);
        currentUserPicture = await getUserPicture(req.session.userEmpID);
        retrievedUserEmails = await getUsersEmails();

        var userVersions = await filledoutforms.find({ form_control_number : sharedFormControlNumber, form_owner : sharedFormOwner }).toArray();
        var latestVersion = 0;
        var latestUserVersion = 0;

        for(i=0; i < userVersions.length; i++){
            if(userVersions[i].user_version >= latestVersion){
                latestVersion = userVersions[i].user_version;
            }
        }

        var currentUserForm = await filledoutforms.findOne({ form_control_number : sharedFormControlNumber, form_owner : sharedFormOwner, user_version: latestVersion });

        try{
            jsonObject = currentUserForm;
            var e = jsonObject.form_content;
            var g = await jsonToHTML(e);
            jsonObject.form_content = g;
        }catch(error){
            logError("Error at shared view: " + error);
        }

        res.render('sharedview', {
            title: 'Shared Form',
            retrievedUserEmails : retrievedUserEmails,
            currentUserDetailsBlock : currentUserDetailsBlock,
            currentUserPrivileges: currentUserPrivileges,
            currentUserNotifications: currentUserNotifications,
            currentForm: jsonObject,
            currentUserPicture: currentUserPicture,
            min_idleTime: min_idleTime
        });

    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.get('/formview/:form_control_number', async function (req, res){
    if(req.session.loggedIn){
        req.session.form_control_number = req.params.form_control_number;

        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);
        currentUserPicture = await getUserPicture(req.session.userEmpID);
        retrievedUserEmails = await getUsersEmails();

        var retrievedUserEmails;
        var selectedFormControlNumberToView = req.params.form_control_number;
        formVersions = await forms.find({ form_control_number : selectedFormControlNumberToView }).toArray();
        var allVersions = await filledoutforms.find({ form_control_number : selectedFormControlNumberToView, form_owner : req.session.userEmpID }).toArray();
        var latestVersion = 0;
        var latestUserVersion = 0;

        for(i=0; i < formVersions.length; i++){
            if(formVersions[i].form_version >= latestVersion){
                latestVersion = formVersions[i].form_version;
            }
        }

        var currentForm = await forms.findOne({ form_control_number : selectedFormControlNumberToView, form_version: latestVersion });
        var formTemplate = await forms.findOne({ form_control_number : selectedFormControlNumberToView, form_version: latestVersion });
        var userFormVersions = await filledoutforms.find({ form_control_number : selectedFormControlNumberToView,  form_owner: req.session.userEmpID}).toArray();
        var jsonObject;

        if(userFormVersions == 0){

            var latestWriteUsers = [];
            var latestReadUsers = [];

            jsonObject = currentForm;
            const filledOutDocument = {
                form_name: currentForm.form_name,
                form_control_number: currentForm.form_control_number,
                form_content: currentForm.form_content,
                form_version: currentForm.form_version,
                form_status: "On-going",
                shared_status: Boolean(currentForm.shared_status),
                allow_file_upload : Boolean(currentForm.allow_file_upload),
                date_saved: getDateNow(),
                time_saved: getTimeNow(),
                user_version: 0,
                form_owner: req.session.userEmpID,
                read_users: latestReadUsers,
                write_users: latestWriteUsers,
                due_date: currentForm.due_date,
                quarter_due_date: currentForm.quarter_due_date,
                annual_due_date: currentForm.annual_due_date,
                academic_year: currentForm.academic_year,
                semester: currentForm.semester,
                dean_approval: "Not Approved",
                department_head_approval: "Not Approved",
                secretary_approval: "Not Approved",
            };

            const result = await filledoutforms.insertOne(filledOutDocument);

            for(i = 0; i < userFormVersions.length; i++){
                if(userFormVersions[i].user_version >= latestUserVersion){
                    latestUserVersion = userFormVersions[i].user_version;
                }
            }

            latestUserFilledVersion = await filledoutforms.findOne({ form_control_number : selectedFormControlNumberToView, user_version: latestUserVersion, form_owner : req.session.userEmpID });


            jsonObject = latestUserFilledVersion;

            if(currentForm.form_version != latestUserFilledVersion.form_version){
                jsonObject.form_content = await updateToLatestVersion(currentForm.form_content, latestUserFilledVersion.form_content);
            }

            allVersions = await filledoutforms.find({ form_control_number : selectedFormControlNumberToView, form_owner : req.session.userEmpID }).toArray();
        }else{
            for(i = 0; i < userFormVersions.length; i++){
                if(userFormVersions[i].user_version >= latestUserVersion){
                    latestUserVersion = userFormVersions[i].user_version;
                }
            }
            latestUserFilledVersion = await filledoutforms.findOne({ form_control_number : selectedFormControlNumberToView, user_version: latestUserVersion, form_owner : req.session.userEmpID });

            jsonObject = latestUserFilledVersion;

            if(currentForm.form_version != latestUserFilledVersion.form_version){
                jsonObject.form_content = await updateToLatestVersion(currentForm.form_content, latestUserFilledVersion.form_content);
            }
        }

        var sharedRead = jsonObject.read_users;
        var sharedWrite = jsonObject.write_users;

        logStatus("This is the json object: " + jsonObject);
        var e = jsonObject.form_content;
        var g = await jsonToHTML(e);
        jsonObject.form_content = g;

        var initialUserForm = await filledoutforms.findOne({ form_control_number : selectedFormControlNumberToView, form_owner : req.session.userEmpID, user_version : 0 });
        var h = initialUserForm.form_content;
        var i = await jsonToHTML(h);
        initialUserForm.form_content = i;

        var currentUserFiles = await files.find({ uploadedBy : latestUserFilledVersion.form_owner, fileFormControlNumber : latestUserFilledVersion.form_control_number }).toArray();

        var submittedVersions = await filledoutforms.find({ form_control_number : selectedFormControlNumberToView, form_status : "Submitted" }).toArray();

        for(const form of submittedVersions){
            const formOwner = form.form_owner;
            const user = await users.findOne({ emp_id: formOwner });
            if (user) {
                form.user_department = user.user_department;
            } else {
                logError("User not found for form_owner: " + formOwner);
            }
        }

        var latestAssignedVersion = 0;
        var latestAssignedUsers;

        for(i=0; i < formVersions.length; i++){
            if(formVersions[i].form_version >= latestAssignedVersion){
                latestVersion = formVersions[i].form_version;
                latestAssignedUsers = formVersions[i].assigned_users;

                if(formVersions[i].read_users){
                    let uniqueAssignedUsers = new Set([...latestAssignedUsers, ...formVersions[i].assigned_users]);
                    latestAssignedUsers = Array.from(uniqueAssignedUsers);
                }
            }
        }

        var allAssignedUsers = await users.find({ email: { $in: latestAssignedUsers } }).toArray();
        var previouslySubmittedForms = await filledoutforms.find({ form_owner : req.session.userEmpID, form_status : "Submitted" }).toArray();
    //    currentUserFiles = await getFiles(req.session.userEmpID);

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
            min_idleTime: min_idleTime,
            form_template : formTemplate,
            submittedVersions: submittedVersions,
            sharedRead: sharedRead,
            sharedWrite: sharedWrite,
            allAssignedUsers: allAssignedUsers,
            previouslySubmittedForms: previouslySubmittedForms,
            userCurrentPage: "formview",
            initialUserForm: initialUserForm
        });
    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/shareform', async function(req, res){
    if(req.session.loggedIn){
        try {
            var formData = req.body;
            var selectedFormControlNumberToView = formData.formControlNumber;
            var formVersions = await forms.find({ form_control_number : selectedFormControlNumberToView }).toArray();

            if(!formData.shareTo){
                res.send({status_code : 1});
            }else{
                if(formData.sharedUserPrivileges == 'Viewer'){
                    const result = await filledoutforms.updateMany(
                        { form_control_number : selectedFormControlNumberToView, form_owner : req.session.userEmpID },
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
                }else if (formData.sharedUserPrivileges == 'Editor'){
                    const result = await filledoutforms.updateMany(
                        { form_control_number : selectedFormControlNumberToView, form_owner : req.session.userEmpID },
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
                    logStatus("Could not insert shared user.");
                    res.send({ status_code: 2 });
                }
            }
        }catch(error){
            logError("Error at share form POST: " + error);
        }
    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.get('/viewformtemplate/:form_control_number', async function (req, res){
    if(req.session.loggedIn){
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

            let jsonObject = currentForm;
            var e = jsonObject.form_content;
            var g = await jsonToHTML(e);
            jsonObject.form_content = g;

            res.render('viewformtemplate', {
                title: 'View Forms',
                currentUserDetailsBlock : currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                currentForm: jsonObject,
                currentUserPicture: currentUserPicture,
                allVersions: allVersions,
                min_idleTime: min_idleTime,
                userCurrentPage: "viewformtemplate"
            });

        }catch(error){
            logError("Error at viewformtemplate with controlnumber: " + error);
        }
    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.get('/', async function (req, res){
    try{
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
                min_idleTime: min_idleTime,
                userCurrentPage: "index"
            });
        }

    }catch (error){
        logError("Error at index: " + error);
    }
});

app.get('/accountsettings', async function (req, res){
    try{
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
                min_idleTime: min_idleTime,
                userCurrentPage: "accountsettings"
            });
        }

    }catch (error){
        logError("Error at account settings: " + error);
    }
});

app.post('/', upload.single('file'), async function (req, res){
    if(req.session.loggedIn){
        const uploadedFile = req.file;
        logStatus("Received file: " + req.file);
        var fileFormControlNumber = req.session.form_control_number;

        if(!uploadedFile){
            logStatus("No file Uploaded");
        }else{
            const { originalname, size } = uploadedFile;
            logStatus("File Uploaded Successfully in " + `/uploads/${currentUserDetailsBlock.firstName}/${originalname}`);

            try{
                uploadInfo = {
                    "fileFormControlNumber": fileFormControlNumber,
                    "file_name": originalname,
                    "file_size": size,
                    "uploadedBy": req.session.userEmpID,
                    "uploadedAt": new Date()
                };

                result = await files.insertOne(uploadInfo);
                logStatus("Saved file in database : " + uploadInfo);
                const documents = await files.find({ uploadedBy : req.session.userEmpID, fileFormControlNumber : fileFormControlNumber }).toArray();

                res.json({documents});
            }catch(error){
                logError("Error at index post upload file: " + error);
            }
        }
    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.delete('/ajaxdelete/:file_name/:form_owner', async function (req, res){
    if(req.session.loggedIn){
        var selectedFileForDeletion = req.params.file_name;
        var selectedUser = req.params.form_owner;
        logStatus("No file being selected to delete: " + selectedFileForDeletion);

        function deleteFile(filePath, callback) {
            fs.unlink(filePath, function (error) {
                if (error) {
                    logError(error);
                    callback(error);
                } else {
                    callback(null);
                }
            });
        }

        var filePathToDelete = "uploads/" + selectedUser + "/"  + selectedFileForDeletion;

        deleteFile(filePathToDelete, function (error) {
            if(error){
                logError("Error deleting file:" + error);
            }else{
                logStatus("File deleted successfully.");
            }
        });

        const deleteCriteria = {file_name: selectedFileForDeletion, uploadedBy: selectedUser};

        await files.deleteOne(deleteCriteria, function (error, result){
            if(error){
                logError("Error deleting file:" + error);
            }else{
                logStatus("File deleted successfully.")
            }
        });

        const documents = await getFiles(selectedUser);

        res.json({documents});
    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/reseat/:empID', async function (req, res){
    var dataPlaceholder = "success!!";
    try{
        var reconnectingEmpID = req.params.empID;
        req.session.userEmpID = reconnectingEmpID;
        req.session.loggedIn = true;
        res.json({dataPlaceholder});
        logStatus("User Reseated");
    }catch(error){
        logError(error);
        res.json({error});
    }

});

app.get('/logout', async function(req, res){
    req.session.loggedIn = false;
    req.session.destroy();
    res.redirect('/login');

    logStatus("User has logged out!");
});

app.get('/login', async function(req, res){
    try{
        if(req.session.loggedIn){
            res.redirect('/');
        }else{
            res.render('login', {
                title: 'Login Page'
            });
        }
    }catch (error){
        logError("Error at Login: " + error);
    }
});

app.get('/aboutUs', async function(req, res){
    try{
        if(req.session.loggedIn){
            res.redirect('/');
        } else {
            res.render('aboutUs', {
                title: 'About Us'
            });
        }
    }catch (error){
        logStatus("Error at about us: " + error);
    }
});

app.get('/techSupport', async function(req, res){
    try{
        if(req.session.loggedIn){
            res.redirect('/');
        }else{
            res.render('techSupport', {
                title: 'Tech Support'
            });
        }
    }catch (error){
        logError("Error at tech support: " + error);
    }
});

app.get('/ourTeam', async function(req, res){
    try{
        if(req.session.loggedIn){
            res.redirect('/');
        }else{
            res.render('ourTeam', {
                title: 'Our Team'
            });
        }
    }catch (error){
        logError("Error at our team: " + error);
    }
});

app.post('/login', async function (req, res){
    if(req.session.loggedIn){
        res.redirect('/');
    } else {
        var email = req.body.email.toLowerCase();
        var password = req.body.passWord;

        try {
            const user = await users.findOne({ email: email });
            if(!user){
                logStatus("Cannot find user");

                res.render('login', {
                    title: 'Login Page', receivedError: "Incorrect Username or Password!"
                });
            }else if (password === user.password){
                req.session.loggedIn = true;
                req.session.userEmpID = user.emp_id;
                req.session.email = user.email;

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
                    min_idleTime: min_idleTime,
                    userCurrentPage: "index"
                });

                logStatus("User " + currentUserDetailsBlock.firstName + currentUserDetailsBlock.lastName + currentUserDetailsBlock.empID + " has logged in with " + currentUserDetailsBlock.userLevel + " privileges!");

            }else{
                res.render('login', {
                    title: 'Login Page', receivedError: "Incorrect Username or Password!"
                });
            }
        }catch (error){
            logError(error);
            res.status(500).send('Internal Server Error');
        }
    }
});

app.get('/createform', async function(req, res){
    var requiredPrivilege = 'Manage Templates';
    var accessGranted = false;

    if (req.session.loggedIn){
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);
        currentUserPicture = await getUserPicture(req.session.userEmpID);
        currentPersonalizedWidgets = await getPersonalizedWidgets(req.session.userEmpID);
        currentHeaderWidgets = await getHeaderWidgets(req.session.userEmpID);
        currentInformationInputWidgets = await getInformationInputWidgets(req.session.userEmpID);
        currentCheckBoxWidgets = await getCheckBoxWidgets(req.session.userEmpID);
        currentGroupedWidgets = await getGroupedWidgets(req.session.userEmpID);
        currentTextWidgets = await getTextWidgets(req.session.userEmpID);
        currentSignatureWidgets = await getSignatureWidgets(req.session.userEmpID);
        currentTableWidgets = await getTableWidgets(req.session.userEmpID);
        accessGranted = validateAction(currentUserPrivileges, requiredPrivilege);

        if(accessGranted){
            res.render('createform', {
                title: 'Create Form',
                currentUserDetailsBlock : currentUserDetailsBlock,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                currentUserPicture: currentUserPicture,
                min_idleTime: min_idleTime,
                userCurrentPage: "createform"
            });

            logStatus("Access Granted!");

        }else{
            res.render('error_screen', {
                title: 'Create Form',
                currentUserDetailsBlock : currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                min_idleTime: min_idleTime,
                errorMSG : "Access Denied"
            });

            logStatus("User Denied");
        }
    }else{
        res.redirect('login');
    }
});

app.get('/createwidget', async function(req, res){
    var requiredPrivilege = 'Manage Templates';
    var accessGranted = false;

    if(req.session.loggedIn){
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
                min_idleTime: min_idleTime,
                userCurrentPage: "createwidget"
            });
            logStatus("Access Granted!");

        }else{
            res.render('error_screen', {
                title: 'Create Form',
                currentUserDetailsBlock : currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                min_idleTime: min_idleTime,
                errorMSG : "Access Denied"
            });

            logStatus("User Denied");

        }
    }else{
        res.redirect('login');
    }
});

function getUniqueForms(formsGroup){
    var uniqueForms = [];
    var seenControlNumber = {};

    for (const obj of formsGroup){
        if (!seenControlNumber[obj.form_control_number]){
            seenControlNumber[obj.form_control_number] = true;
            uniqueForms.push(obj);
        }
    }
    return uniqueForms;
}

app.get('/viewforms', async function(req, res){
    var requiredPrivilege = 'View Forms Only';
    var accessGranted = false;

    if(req.session.loggedIn){
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);
        currentUserForms = await getUserForms(req.session.userEmpID);
        currentUserPicture = await getUserPicture(req.session.userEmpID);

        accessGranted = validateAction(currentUserPrivileges, requiredPrivilege);

        if(accessGranted){
            var allPublishedForms = await forms.find({ form_status: { $in: ["Published", "Active", "In-active"] } }).toArray();
            var allSubmittedForms = await filledoutforms.find({ form_status: "Submitted" }).toArray();
            var allAssignedForms = await forms.find({ assigned_users : req.session.email, form_status : { $in: ["Active", "Submitted"] } }).toArray();
            var allSharedForms = await filledoutforms.find({
                $or: [
                    { read_users : req.session.userEmpID },
                    { write_users : req.session.userEmpID },
                    { form_owner : req.session.userEmpID }
                ]
            }).toArray();

            var publishedForms = getUniqueForms(allPublishedForms);
            var assignedForms = getUniqueForms(allAssignedForms);
            var sharedForms = getUniqueForms(allSharedForms);
            var submittedForms = getUniqueForms(allSubmittedForms);

            res.render('viewforms', {
                title: 'View Forms',
                currentUserDetailsBlock : currentUserDetailsBlock,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                publishedForms: publishedForms,
                submittedForms: submittedForms,
                assignedForms: assignedForms,
                sharedForms: sharedForms,
                currentUserPicture: currentUserPicture,
                min_idleTime: min_idleTime,
                userCurrentPage: "viewforms"
            });

            logStatus("Access Granted!");

        }else{
            res.render('error_screen', {
                title: 'View Forms',
                currentUserDetailsBlock : currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                min_idleTime: min_idleTime,
                errorMSG : "Access Denied"
            });
            logStatus("User Denied");

        }
    }else{
        res.redirect('login');
    }
});

app.get('/viewformtemplates', async function(req, res){
    var requiredPrivilege = 'Manage Templates';
    var accessGranted = false;

    if(req.session.loggedIn){
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);
        currentForms = await getForms(req.session.userEmpID);
        currentUserPicture = await getUserPicture(req.session.userEmpID);

        currentForms = getUniqueForms(currentForms);
        accessGranted = validateAction(currentUserPrivileges, requiredPrivilege);

        if(accessGranted){
            res.render('viewformtemplates', {
                title: 'View Form Templates',
                currentUserDetailsBlock : currentUserDetailsBlock,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                currentForms: currentForms,
                currentUserPicture: currentUserPicture,
                min_idleTime: min_idleTime,
                userCurrentPage: "viewformtemplates"
            });

            logStatus("Access Granted!");

        }else{
            res.render('error_screen', {
                title: 'View Forms',
                currentUserDetailsBlock : currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                min_idleTime: min_idleTime,
                errorMSG : "Access Denied"
            });

            logStatus("User Denied");
        }
    }else{
        res.redirect('login');
    }
});

app.get('/createusers', async function(req, res){
    var requiredPrivilege = 'User Management';
    var accessGranted = false;

    if(req.session.loggedIn){
        currentUserFiles = await getFiles(req.session.userEmpID);
        currentUserDetailsBlock = await getUserDetailsBlock(req.session.userEmpID);
        currentUserPrivileges = await getUserPrivileges(currentUserDetailsBlock.userLevel);
        currentUserNotifications = await getNotifications(req.session.userEmpID);
        currentUserPicture = await getUserPicture(req.session.userEmpID);

        accessGranted = validateAction(currentUserPrivileges, requiredPrivilege);

        if(accessGranted){
            res.render('createusers', {
                title: 'Create Users',
                currentUserDetailsBlock: currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                currentUserPicture: currentUserPicture,
                min_idleTime: min_idleTime,
                userCurrentPage: "createusers"
            });
        }else{
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

    }else{
        res.redirect('login');
    }
});

app.post('/createusers', async function(req, res){
    if(req.session.loggedIn){
        var email = req.body.email.toLowerCase();
        var password = req.body.passWord;
        var emp_id = req.body.empId;
        var firstname = req.body.firstName;
        var lastname = req.body.lastName;
        var userlevel = req.body.userLevel;
        var userdepartment = req.body.userDepartment;

        try{
            const existingUser = await db.collection('users').findOne({ email: email });
            const existingEmpID = await db.collection('users').findOne({ emp_id: emp_id });
            if(existingUser){
                logStatus("User already exists!");
                res.send({ status_code : 1 });
            }else if((userlevel === "Faculty" || userlevel === "Department Head") && (userdepartment === "null" || userdepartment === "undefined" || userdepartment === "")){
                logStatus("Employee must have a Department");
                res.send({ status_code : 3 });
            }else if(existingEmpID){
                logStatus("Employee ID already exists!");
                res.send({ status_code : 2 });
            }else if(userdepartment === "null" || userdepartment === "undefined" || userdepartment === ""){
                let newUser = {
                    "email": email,
                    "password": password,
                    "emp_id": emp_id,
                    "first_name": firstname,
                    "last_name": lastname,
                    "user_level": userlevel
                };
                const result = await db.collection('users').insertOne(newUser);
                logStatus("User created");
                res.send({ status_code : 0 });
            }else{
                let newUser = {
                    "email": email,
                    "password": password,
                    "emp_id": emp_id,
                    "first_name": firstname,
                    "last_name": lastname,
                    "user_level": userlevel,
                    "user_department": userdepartment
                };
                const result = await db.collection('users').insertOne(newUser);
                logStatus("User created");
                res.send({ status_code : 0 });
            }
        }catch(error){
            logError("Error creating the user: " + error);
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
            min_idleTime: min_idleTime,
            userCurrentPage: "createusers"
        });
    }else{
       res.render('login', {
            title: 'Login Page'
       });
    }
});

app.get('/viewusers', async function(req, res){
    var requiredPrivilege = 'View Users';
    var accessGranted = false;

    try {
        if(!req.session.loggedIn){
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
                userAccounts: userAccounts,
                userCurrentPage: "viewusers"
            });

            logStatus("Access Granted!");

        }else{
            res.render('error_screen', {
                title: 'View Users',
                currentUserDetailsBlock: currentUserDetailsBlock,
                currentUserFiles: currentUserFiles,
                currentUserPrivileges: currentUserPrivileges,
                currentUserNotifications: currentUserNotifications,
                min_idleTime: min_idleTime,
                errorMSG : "Access Denied"
            });
            logStatus("User Denied");
        }

    }catch (error){
        logError("Error at viewing users: " + error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/accountsettings', pictureUpload.single('file'), async function (req, res){
    if(req.session.loggedIn){
        const uploadedPicture = req.file;

        logStatus("Received file: " + req.file);

        if(!uploadedPicture){
            logStatus("No file Uploaded");
        }else{
            const { originalname } = uploadedPicture;
            var uploadedPictureDirectory = "";

            logStatus("File Uploaded Successfully in " + `/views/profile_pictures/${currentUserDetailsBlock.firstName}/${originalname}`);

            try{
                var picture = await users.findOne({ emp_id: req.session.userEmpID });
                if (picture.user_picture == '' || picture.user_picture == null || picture.user_picture == undefined){
                    userPicture = users.findOneAndUpdate(
                        { "emp_id": currentUserDetailsBlock.empID },
                        { $set: { "user_picture": "/profile_pictures/" + req.session.userEmpID + "/" + originalname } },
                        { returnNewDocument: true }
                    )
                }else{
                    fs.unlink("./views/" + picture.user_picture, function (error){
                        logStatus("Failed to Remove Previous Profile Picture " + error);

                    });
                    userPicture = users.findOneAndUpdate(
                        { "emp_id": currentUserDetailsBlock.empID },
                        { $set: { "user_picture": "/profile_pictures/" + req.session.userEmpID + "/" + originalname } },
                        { returnNewDocument: true }
                    )
                }

                uploadedPictureDirectory = users.user_picture;
                logStatus("Picture saved in database: " + uploadedPictureDirectory);

                res.json({uploadedPictureDirectory});
            }catch(error){
                logError(error);
            }
        }
    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.post('/upload', upload.single('file'), async function (req, res){
    if(req.session.loggedIn){
        const uploadedFile = req.file;

        if(!uploadedFile){
            logStatus("No file Uploaded");
        }else{
            const { originalname, size } = uploadedFile;

            logStatus("File Uploaded Successfully in " + `/uploads/${userDetailsBlock.firstName}/${originalname}`);


            try{
                uploadInfo = {
                    "file_name": originalname,
                    "file_size": size,
                    "uploadedBy": req.session.userEmpID,
                    "uploadedAt": new Date()
                };
                result = await files.insertOne(uploadInfo);

                if(debug_mode){
                    logStatus("Inserted : " + uploadInfo);
                }

                const documents = await getFiles(req.session.userEmpID);

                res.json({documents});
            }catch(error){
                logError(error);
            }
        }
    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.post('/update-Password', async function(req, res){
    if(req.session.loggedIn){
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

                    logStatus("Password of " + currentUser.emp_id + " was updated.");

                    res.send({status_code: 0});
                }else{
                    logStatus("New password should not be the same as your current password.");
                    res.send({status_code: 1})
                }
            }else{
                logStatus("Current password is incorrect.");
                res.send({status_code: 2});
            }
        }catch(error){
            logError("Failed updating password " + error);
        }
    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/AJAX_assignDepartment', async function(req, res){
    if(req.session.loggedIn){
        try{
            var formData = req.body;
            var formControlNumber = formData.formControlNumber;
            var chosenDepartment = formData.assignedDepartment;
            var allAssignedDepartment = await users.find({ user_department: chosenDepartment }).toArray();
            var assignedDepartmentEmails = [];
            for(const email of allAssignedDepartment){
                assignedDepartmentEmails.push(email.email);
            }

            await forms.updateMany(
                { form_control_number: formControlNumber },
                { $addToSet: { assigned_users: { $each: assignedDepartmentEmails } } }
            );

            var formVersions = await forms.find({ form_control_number : formControlNumber }).toArray();
            var latestAssignedVersion = 0;
            var latestAssignedUsers;

            for (var i = 0; i < formVersions.length; i++) {
                if (formVersions[i].form_version >= latestAssignedVersion) {
                    latestAssignedVersion = formVersions[i].form_version;
                    latestAssignedUsers = formVersions[i].assigned_users;

                    if (formVersions[i].read_users) {
                        let uniqueAssignedUsers = new Set([...latestAssignedUsers, ...formVersions[i].assigned_users]);
                        latestAssignedUsers = Array.from(uniqueAssignedUsers);
                    }
                }
            }

            var allAssignedUsers = await users.find({ email: { $in: latestAssignedUsers } }).toArray();
            res.send({ status_code : 0, allAssignedUsers : allAssignedUsers });
        }catch(error){
            logError('There was an error at AJAX function in assigning the department: ' + error);
            res.send({ status_code : 1 });
        }
    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/AJAX_assignUsers', async function(req, res){
    if(req.session.loggedIn){
        try{
            var formData = req.body;
            var formControlNumber = formData.formControlNumber;

            await forms.updateMany(
                { form_control_number : formControlNumber },
                { $addToSet: { "assigned_users" : formData.assignedUser } }
            );

            var formVersions = await forms.find({ form_control_number : formControlNumber }).toArray();
            var latestAssignedVersion = 0;
            var latestAssignedUsers;

            for (var i = 0; i < formVersions.length; i++) {
                if (formVersions[i].form_version >= latestAssignedVersion) {
                    latestAssignedVersion = formVersions[i].form_version;
                    latestAssignedUsers = formVersions[i].assigned_users;

                    if (formVersions[i].read_users) {
                        let uniqueAssignedUsers = new Set([...latestAssignedUsers, ...formVersions[i].assigned_users]);
                        latestAssignedUsers = Array.from(uniqueAssignedUsers);
                    }
                }
            }

            var allAssignedUsers = await users.find({ email: { $in: latestAssignedUsers } }).toArray();
            console.log("These are the updated assigned users: " + allAssignedUsers);

            res.send({ status_code : 0, allAssignedUsers : allAssignedUsers });
        } catch(error){
            logError('There was an error at AJAX function in assigning users: ' + error);
            res.send({ status_code : 2 });
        }
    } else {
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/AJAX_removeUser/:email', async function(req, res){
    if(req.session.loggedIn){
        try{
            var unassignedUser = req.params.email;
            var formData = req.body;
            var selectedFormControlNumberToView = formData.formControlNumber;
            var formVersions = await forms.find({ form_control_number: selectedFormControlNumberToView }).toArray();

            var latestAssignedVersion = 0;
            var latestAssignedUsers;

            for (var i = 0; i < formVersions.length; i++) {
                if (formVersions[i].form_version >= latestAssignedVersion) {
                    latestAssignedVersion = formVersions[i].form_version;
                    latestAssignedUsers = formVersions[i].assigned_users;

                    if (formVersions[i].read_users) {
                        let uniqueAssignedUsers = new Set([...latestAssignedUsers, ...formVersions[i].assigned_users]);
                        latestAssignedUsers = Array.from(uniqueAssignedUsers);
                    }
                }
            }

            latestAssignedUsers = latestAssignedUsers.filter(user => user !== unassignedUser);

            updateDocument = await forms.updateMany(
                { form_control_number : selectedFormControlNumberToView },
                { $set: { assigned_users : latestAssignedUsers } }
            );

            var allAssignedUsers = await users.find({ email: { $in: latestAssignedUsers } }).toArray();
            console.log("This are the updated assigned users: " + JSON.stringify(allAssignedUsers));

            res.send({ status_code : 0, allAssignedUsers : allAssignedUsers });

        } catch(error){
            logError('There was an error at AJAX function in unassigning users: ' + error);
            res.send({ status_code : 1 });
        }
    } else {
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/AJAX_setDueDate', async function(req, res){
    if(req.session.loggedIn){
        var formData = req.body;
        var selectedFormControlNumberToView = formData.formControlNumber;
//        var formVersions = await forms.find({ form_control_number : selectedFormControlNumberToView }).toArray();
        var updateDocument;
        var updateFilledOutForms;

        try{
            updateDocument = await forms.updateMany(
                { form_control_number : selectedFormControlNumberToView },
                { $set: {
                        due_date: formData.dueDateInput,
                        quarter_due_date: formData.quarterlyDueDate,
                        annual_due_date: formData.annualDueDate,
                        academic_year: formData.academicYear,
                        semester: formData.semester } }
            );

            updateFilledOutForms = await filledoutforms.updateMany(
                { form_control_number : selectedFormControlNumberToView },
                { $set: {
                        due_date: formData.dueDateInput,
                        quarter_due_date: formData.quarterlyDueDate,
                        annual_due_date: formData.annualDueDate,
                        academic_year: formData.academicYear,
                        semester: formData.semester } }
            );

            res.send({ status_code : 0, dueDate : formData.dueDateInput });


        }catch(error){
            logError("There was an error at ajax function setting due date: " + error);
            res.send({ status_code : 1 });
        }
    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/AJAX_toggleActivate', async function(req, res){
    if(req.session.loggedIn){
        var formData = req.body;
        var selectedFormControlNumberToView = formData.formControlNumber;
        var targetedVersion = parseInt(formData.targetedVersion, 10);
        targetedForm = await forms.findOne({ form_control_number : selectedFormControlNumberToView, form_version : targetedVersion });
        var updateDocument;

        try{
            if(targetedForm.form_status == "Published"){
                try{
                    updateDocument = await forms.findOneAndUpdate(
                        { form_control_number : selectedFormControlNumberToView, form_version : targetedVersion },
                        { $set: { form_status: "Active" } }
                    );
                    res.send({ status_code : 0 });
                }catch(error){
                    logError("There was an error at activating form: " + error);
                    res.send({ status_code : 1 });
                }
            }else if(targetedForm.form_status == "Active"){
                try{
                    updateDocument = await forms.findOneAndUpdate(
                        { form_control_number : selectedFormControlNumberToView, form_version : targetedVersion },
                        { $set: { form_status: "In-active" } }
                    );
                    res.send({ status_code : 0 });
                }catch(error){
                    logError("There was an error at de-activating form: " + error);
                    res.send({ status_code : 1 });
                }
            }else{
                try{
                    updateDocument = await forms.findOneAndUpdate(
                        { form_control_number : selectedFormControlNumberToView, form_version : targetedVersion },
                        { $set: { form_status: "Active" } }
                    );
                    res.send({ status_code : 0 });
                }catch(error){
                    logError("There was an error at de-activating form: " + error);
                    res.send({ status_code : 1 });
                }
            }
        }catch(error){
            logError("There was an error at ajax function toggle activate form: " + error);
            res.send({ status_code : 2 });
        }
    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/AJAX_viewSharedForm', async function (req, res){
    if(req.session.loggedIn){
        formData = req.body;
        req.session.form_control_number = formData.formControlNumber;
        req.session.form_owner = formData.formOwner;

        sharedForm = await filledoutforms.findOne({ form_control_number : req.session.form_control_number, form_owner : req.session.form_owner });

        if(!sharedForm){
            res.send({ status_code : 1 });
        }else if(sharedForm){
            res.send({ status_code : 0 });
        }else{
            res.send({ status_code : 2 });
        }
    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/AJAX_togglePublish', async function(req, res){
    if(req.session.loggedIn){
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
                    logStatus("the found status of : " + targetedVersion + "is : " + currentStatus);
                    let secretary = await users.findOne({ user_level : "Secretary" });
                    let senderName = await users.findOne({ emp_id : req.session.userEmpID });

                    if(currentStatus == "Template"){
                        try {
                            console.log("Entering the setting of Status");

                            updateDocument = await forms.findOneAndUpdate(
                                { form_control_number : selectedFormControlNumberToView, form_version : targetedVersion },
                                { $set: { form_status: "Published" } }
                            );

                            let uploadNotif = await notifications.insertOne({
                                sender: req.session.userEmpID,
                                sender_name: senderName.first_name,
                                receiver: secretary.emp_id,
                                time_sent: getTimeNow(),
                                date_sent: getDateNow(),
                                status: "Unseen",
                                message: "The Document Controller has now Published the form " + formData.formName
                            });

                            updatedStatus = "Published";
                            logStatus("Finished the setting of Status");
                        }catch(error){
                            logError(error);
                        }

                        logStatus("Setting control number : " + selectedFormControlNumberToView + " with version " + targetedVersion + " to Published");
                    }else{

                        updateDocument = await forms.findOneAndUpdate(
                            { form_control_number : selectedFormControlNumberToView, form_version : targetedVersion },
                            { $set: { form_status: "Template" } }
                        );

                            let uploadNotif2 = await notifications.insertOne({
                                sender: req.session.userEmpID,
                                sender_name: senderName.first_name,
                                receiver: secretary.emp_id,
                                time_sent: getTimeNow(),
                                date_sent: getDateNow(),
                                status: "Unseen",
                                message: "The Document Controller has Un-Published the form " + formData.formName
                            });

                        updatedStatus = "Template";
                        logStatus("Setting control number : " + selectedFormControlNumberToView + " with version " + targetedVersion + " to Template");
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
                logStatus('There was an error in AJAX Toggle Publish: ' + error);
                res.send({ status_code : 1 });
            }else{
                res.send({ status_code : 0 , updatedStatus : updatedStatus});
            }
        }catch(error){
            logError('There was an error in AJAX Toggle Publish: ' + error);
        }

    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/AJAX_toggleAllowFileUpload', async function(req, res){
    if(req.session.loggedIn){
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
                        updateDocument = await forms.updateMany(
                            { form_control_number : selectedFormControlNumberToView },
                            { $set: { allow_file_upload: true } }
                        );
                        updatedStatus = "Allowed";
                    }catch(error){
                        logError(error);
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
            logError(error);
            successfulWow = false;
        }

        try{
            if(!successfulWow){
                logStatus('There was an error in AJAX Toggle Publish: ' + error);
                res.send({ status_code : 1 });
            }else{
                res.send({ status_code : 0 , updatedStatus : updatedStatus});
            }
        }catch(error){
            logError('There was an error in AJAX Toggle Publish: ' + error);
        }

    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/AJAX_toggleSharing', async function(req, res){
    if(req.session.loggedIn){
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
                    }catch(error){
                        logError(error);
                    }
                }else{
                    updateDocument = await forms.updateMany(
                        { form_control_number : selectedFormControlNumberToView },
                        { $set: { shared_status: false } }
                    );
                    updatedStatus = "Not Allowed";
                }
            }

            successfulWow = true;
        }catch(error){
            logError(error);
            successfulWow = false;
        }

        try{
            if(!successfulWow){
                logStatus('There was an error in AJAX Toggle Publish: ' + error);
                res.send({ status_code : 1 });
            } else {
                res.send({ status_code : 0 , updatedStatus : updatedStatus});
            }
        }catch(error){
            logError('There was an error in AJAX Toggle Publish: ' + error);
        }

    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/AJAX_viewFormVersion', async function(req, res) {
    if(req.session.loggedIn){
        var formData = req.body;
        var currentForm = await forms.findOne({ form_control_number: formData.formControlNumber, form_version: parseInt(formData.versionChoice, 10) });

        if(!currentForm){
            logStatus("Could not find the form.");
            res.send({ status_code : 1 });
        }else{
            let jsonObject = currentForm;
            var e = jsonObject.form_content;
            var g = await jsonToHTML(e);

            try{
                jsonObject.form_content = g;
                res.send({ status_code : 0, formContent : jsonObject.form_content, formStatus : currentForm.form_status, sharedStatus : currentForm.shared_status, formVersion : currentForm.form_version });
            }catch(error){
                logError("Error at view form version for front end: " + error);
            }
        }
    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/AJAX_returnSubmittedForm', async function(req, res) {
    if(req.session.loggedIn){
        var formData = req.body;
        var selectedFormControlNumberToView = formData.formControlNumber;
        var updateDocument;
        var submittedForm = await filledoutforms.findOne({ form_control_number: selectedFormControlNumberToView, form_status : "Submitted", form_owner : formData.formOwner });

        if(!submittedForm){
            logStatus("Could not find the form.");
            res.send({ status_code : 1 });
        }else{
            if(currentUserDetailsBlock.userLevel == "Secretary"){
                updateDocument = await filledoutforms.findOneAndUpdate(
                    { form_control_number: selectedFormControlNumberToView, form_status : "Submitted", form_owner : formData.formOwner },
                    { $set: { secretary_approval: "Returned" } },
                    { returnDocument: 'after' }
                );
            }else if(currentUserDetailsBlock.userLevel == "Department Head"){
                updateDocument = await filledoutforms.findOneAndUpdate(
                    { form_control_number: selectedFormControlNumberToView, form_status : "Submitted", form_owner : formData.formOwner },
                    { $set: { department_head_approval: "Returned" } },
                    { returnDocument: 'after' }
                );
            }else if(currentUserDetailsBlock.userLevel == "Dean"){
                updateDocument = await filledoutforms.findOneAndUpdate(
                    { form_control_number: selectedFormControlNumberToView, form_status : "Submitted", form_owner : formData.formOwner },
                    { $set: { dean_approval: "Returned" } },
                    { returnDocument: 'after' }
                );
            }
        }
        var updatedForm = await filledoutforms.findOne({ form_control_number: selectedFormControlNumberToView, form_status : "Submitted", form_owner : formData.formOwner });
        res.send({ status_code : 0, secretary_approval : updatedForm.secretary_approval, dean_approval : updatedForm.dean_approval, department_head_approval : updatedForm.department_head_approval });
    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/AJAX_approveSubmittedForm', async function(req, res) {
    if(req.session.loggedIn){
        var formData = req.body;
        var selectedFormControlNumberToView = formData.formControlNumber;
        var updateDocument;
        var submittedForm = await filledoutforms.findOne({ form_control_number: selectedFormControlNumberToView, form_status : "Submitted", form_owner : formData.formOwner });

        if(!submittedForm){
            logStatus("Could not find the form.");
            res.send({ status_code : 1 });
        }else{
            if(currentUserDetailsBlock.userLevel == "Secretary"){
                updateDocument = await filledoutforms.findOneAndUpdate(
                    { form_control_number: selectedFormControlNumberToView, form_status : "Submitted", form_owner : formData.formOwner },
                    { $set: { secretary_approval: "Approved" } },
                    { returnDocument: 'after' }
                );
            }else if(currentUserDetailsBlock.userLevel == "Department Head"){
                updateDocument = await filledoutforms.findOneAndUpdate(
                    { form_control_number: selectedFormControlNumberToView, form_status : "Submitted", form_owner : formData.formOwner },
                    { $set: { department_head_approval: "Approved" } },
                    { returnDocument: 'after' }
                );
            }else if(currentUserDetailsBlock.userLevel == "Dean"){
                updateDocument = filledoutforms.findOneAndUpdate(
                    { form_control_number: selectedFormControlNumberToView, form_status : "Submitted", form_owner : formData.formOwner },
                    { $set: { dean_approval: "Approved" } },
                    { returnDocument: 'after' }
                );
            }
        }
        var updatedForm = await filledoutforms.findOne({ form_control_number: selectedFormControlNumberToView, form_status : "Submitted", form_owner : formData.formOwner });
        res.send({ status_code : 0, secretary_approval : updatedForm.secretary_approval, dean_approval : updatedForm.dean_approval, department_head_approval : updatedForm.department_head_approval });
    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/AJAX_renderPrevSubmittedForm', async function(req, res) {
    if(req.session.loggedIn){
        var formData = req.body;
        var selectedFormControlNumberToView = formData.formControlNumber;
        var prevSubmittedForm = await filledoutforms.findOne({ form_control_number: formData.formControlNumber, form_status : "Submitted", form_owner : formData.formOwner, user_version: parseInt(formData.userVersion) });
        var currentUserFiles = await files.find({ uploadedBy : formData.formOwner, fileFormControlNumber : formData.formControlNumber }).toArray();

        if(!prevSubmittedForm){
            logStatus("Could not find the form.");
            res.send({ status_code : 1 });
        }else{
            let jsonObject = prevSubmittedForm;

            try{
                var e = jsonObject.form_content;
            }catch(error){
                logError("Error at storing json object form content to the variable " + error);
            }

            try{
                var g = await jsonToHTML(e);
            }catch(error){
                logError("Error at converting JSON to HTML " + error);
            }

            try{
                jsonObject.form_content = g;
                var updatedForm = await filledoutforms.findOne({ form_control_number: selectedFormControlNumberToView, form_status : "Submitted", form_owner : formData.formOwner });
                res.send({ status_code : 0, formContent : jsonObject.form_content, currentUserFiles : currentUserFiles });
            }catch(error){
                logError("Error at view form version for front end: " + error);
            }
        }

    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/AJAX_renderSubmittedForm', async function(req, res) {
    if(req.session.loggedIn){
        var formData = req.body;
        var selectedFormControlNumberToView = formData.formControlNumber;
        var submittedForm = await filledoutforms.findOne({ form_control_number: selectedFormControlNumberToView, form_status : "Submitted", form_owner : formData.formOwner });
        var currentUserFiles = await files.find({ uploadedBy : formData.formOwner, fileFormControlNumber : formData.formControlNumber }).toArray();

        if(!submittedForm){
            logStatus("Could not find the form.");
            res.send({ status_code : 1 });
        }else{
            let jsonObject = submittedForm;

            try{
                var e = jsonObject.form_content;
            }catch(error){
                logError("Error at storing json object form content to the variable " + error);
            }

            try{
                var g = await jsonToHTML(e);
            }catch(error){
                logError("Error at converting JSON to HTML " + error);
            }

            try{
                jsonObject.form_content = g;
                var updatedForm = await filledoutforms.findOne({ form_control_number: selectedFormControlNumberToView, form_status : "Submitted", form_owner : formData.formOwner });
                res.send({ status_code : 0, formContent : jsonObject.form_content, submittedForm: updatedForm, currentUserFiles : currentUserFiles });
            }catch(error){
                logError("Error at view form version for front end: " + error);
            }
        }

    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

app.put('/AJAX_formUserViewVersion', async function(req, res) {
    if(req.session.loggedIn){
        var formData = req.body;
        var currentUserForm = await filledoutforms.findOne({ form_control_number: formData.formControlNumber, user_version: parseInt(formData.userVersionChoice, 10), form_owner : req.session.userEmpID });

        if(!currentUserForm){
            logStatus("Could not find the form.");
            res.send({ status_code : 1 });
        }else{
            let jsonObject = currentUserForm;

            try{
                var e = jsonObject.form_content;
            }catch(error){
                logError("ERROR AT ECHO " + error);
            }

            try{
                var g = await jsonToHTML(e);
            }catch(error){
                logError("ERROR AT golf " + error);
            }

            try{
                jsonObject.form_content = g;
                res.send({ status_code : 0, formContent : jsonObject.form_content });
            }catch(error){
                logError("Error at view form version for front end: " + error);
            }
        }

    }else{
        res.render('login', {
            title: 'Login Page'
        });
    }
});

async function getUserPicture(empID){
    var userPicture;

    try{
        userPicture = await users.findOne({ emp_id: empID });
        logStatus("The picture is this: " + JSON.stringify(userPicture));

    }catch (error){
        logError("Failed to retrieve user picture " + error);
        throw error;
    }
    return userPicture;
}

async function getUserDetailsBlock(empID){
    var userDetailsBlock;

    try{
        const user = await users.findOne({ emp_id: empID });

        if(!user){
            logStatus("user not found!");
            logStatus("if you are here, you deleted the profile mid-session");
            userDetailsBlock = "";
        }else{
            userDetailsBlock = {
                "firstName": user.first_name,
                "lastName": user.last_name,
                "empID": user.emp_id,
                "userLevel": user.user_level,
                "userDepartment": user.user_department
            }
        }
    }catch(error){
        logError("Failed to retrieve user details block: " + error);
    }
    logStatus("Executed getUserDetailsBlock" + userDetailsBlock);

    return userDetailsBlock;
}

async function logError(errorMessage){
    const logMessage = `${new Date().toISOString()}: ${errorMessage}\n`;
    fs.appendFile('error_log.txt', logMessage, (error) => {
        if(error){
            logError('Error appending to error_log.txt:', error);
        }
    });
}

async function getNotifications(empID){
    var userNotifications;

    try {
        userNotifications = await notifications.find({ receiver: empID }).toArray();
        logStatus("The notifications are: " + JSON.stringify(userNotifications));

    }catch(error){
        logError("Failed to retrieve unseen notifications: " + error);

        throw error;
    }
    return userNotifications;
}

async function getUserForms(empID){
    var userFormsCollections;
    try{
        userFormsCollections = await filledoutforms.find().toArray();
        logStatus("The array forms at function getForms() : " + JSON.stringify(userFormsCollections));

    }catch(error){
        userFormsCollections = [];
        logError("Failed to retrieve forms: " + error);
    }
    return userFormsCollections;
}

async function getForms(empID){
    var formsCollections;
    try{
        formsCollections = await forms.find().toArray();
        logStatus("The array forms at function getForms() : " + JSON.stringify(formsCollections));

    }catch (error){
        formsCollections = [];
        logError("Failed to retrieve forms: " + error);

    }
    return formsCollections;
}

async function getPersonalizedWidgets(empID){
    var personalizedWidgets;
    try{
        personalizedWidgets = await widgets.find({ widget_category : "Personalized" }).toArray();
        logStatus("The array forms at function getPersonalizedWidgets() : " + JSON.stringify(personalizedWidgets));

    }catch (error){
        personalizedWidgets = [];
        logError("Failed to retrieve personalized widgets: " + error);
    }
    return personalizedWidgets;
}

async function getHeaderWidgets(empID){
    var headerWidgets;
    try{
        headerWidgets = await widgets.find({ widget_category : "Header" }).toArray();
        logStatus("The array forms at function getHeaderWidgets() : " + JSON.stringify(headerWidgets));

    }catch (error){
        headerWidgets = [];
        logError("Failed to retrieve header widgets: " + error);
    }
    return headerWidgets;
}

async function getInformationInputWidgets(empID){
    var informationWidgets;
    try{
        informationWidgets = await widgets.find({ widget_category : "Information" }).toArray();
        logStatus("The array forms at function getInformationInputWidgets() : " + JSON.stringify(informationWidgets));

    }catch (error){
        informationWidgets = [];
        logError("Failed to retrieve forms: " + error);
    }
    return informationWidgets;
}

async function getCheckBoxWidgets(empID){
    var checkboxWidgets;
    try{
        checkboxWidgets = await widgets.find({ widget_category : "Checkbox" }).toArray();
        logStatus("The array forms at function getCheckBoxWidgets() : " + JSON.stringify(checkboxWidgets));

    }catch (error){
        checkboxWidgets = [];
        logError("Failed to retrieve forms: " + error);
    }
    return checkboxWidgets;
}

async function getGroupedWidgets(empID){
    var groupedWidgets;
    try{
        groupedWidgets = await widgets.find({ widget_category : "Grouped" }).toArray();
        logStatus("The array forms at function getGroupedWidgets() : " + JSON.stringify(groupedWidgets));

    }catch (error){
        groupedWidgets = [];
        logError("Failed to retrieve forms: " + error);
    }
    return groupedWidgets;
}

async function getTextWidgets(empID){
    var textWidgets;
    try{
        textWidgets = await widgets.find({ widget_category : "Text" }).toArray();
        logStatus("The array forms at function getTextWidgets() : " + JSON.stringify(textWidgets));

    }catch (error){
        textWidgets = [];
        logError("Failed to retrieve forms: " + error);
    }
    return textWidgets;
}

async function getSignatureWidgets(empID){
    var signatureWidgets;
    try{
        signatureWidgets = await widgets.find({ widget_category : "Signature" }).toArray();
        logStatus("The array forms at function getSignatureWidgets() : " + JSON.stringify(signatureWidgets));

    }catch (error){
        signatureWidgets = [];
        logError("Failed to retrieve forms: " + error);
    }
    return signatureWidgets;
}

async function getTableWidgets(empID){
    var tableWidgets;
    try{
        tableWidgets = await widgets.find({ widget_category : "Table" }).toArray();
        logStatus("The array forms at function getTableWidgets() : " + JSON.stringify(tableWidgets));

    }catch (error){
        tableWidgets = [];
        logError("Failed to retrieve forms: " + error);
    }
    return tableWidgets;
}

async function getFiles(empID){
    try{
        const filesDocuments = await files.find({ uploadedBy: empID }).toArray();
        logStatus("The array documents at function getFiles() : " + JSON.stringify(filesDocuments));

        return filesDocuments;
    }catch (error){
        logError("Failed to retrieve documents: " + error);
    }
}

async function getUserAccounts(){
    try{
        const documents = await users.find({}).toArray();
        logStatus("Found all users: " + JSON.stringify(documents));

        return documents;
    }catch (error){
        logError("Error at getting users: " + error);
    }
}

async function getUsersEmails(){
    var userName;
    var empEmails = [];
    try{
        userName = await users.find({}).toArray();

        for(const user of userName){
            empEmails.push(user.email);
        }

        logStatus("This are the user names: " + JSON.stringify(empEmails));
        return empEmails;
    }catch(error){
        logError("There is an error retrieving the user names: " + error);
    }
}

async function getUserPrivileges(user_level){
    var privilegesDocumentsBlock;
    var privilegesDocuments;

    try{
        privilegesDocuments = await privileges.findOne({ user_level: user_level });

        if(!privilegesDocuments || !privilegesDocuments.user_privileges){
            logStatus("No privileges found for user level: " + user_level);
            privilegesDocumentsBlock = [];
        }else{
            if(debug_mode){
                logStatus(privilegesDocuments.user_privileges);
            }
            privilegesDocumentsBlock = privilegesDocuments.user_privileges;
        }

    }catch (error){
        logError("Failed to retrieve privileges: " + error);
        privilegesDocumentsBlock = [];
    }

    return privilegesDocumentsBlock;
}

function validateAction(privileges,requestedAction ){
    var accessGranted = false;
    logStatus("Received " + privileges + " as privileges");

    try{
	    for(i = 0; i < privileges.length; i++){
            if(privileges[i] == requestedAction){
                accessGranted = true;
            }
        }
    }catch(error){
        logError(error);
    }

    logStatus("Returning " + accessGranted);

    return accessGranted;
}

function logStatus(statusLog){
    if(debug_mode){
        console.log(statusLog);
    }
}

function logError(errorMessage){
    console.log(errorMessage);
}

async function updateToLatestVersion(latestFormTemplate, latestFilledOutForm){
    for(const key in latestFilledOutForm){
        if(latestFilledOutForm.hasOwnProperty(key)){
            if(typeof latestFilledOutForm[key] === 'object'){
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
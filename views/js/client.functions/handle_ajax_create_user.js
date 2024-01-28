var createUserFailedModal = document.getElementById('createUserFailedModal');
var createUserFailedOverLay = document.getElementById('createUserFailedOverLay');
var createUserFailedDialogbox = document.getElementById('createUserFailedDialogbox');
var formValidationFailedMessage = document.getElementById('formValidationFailedMessage');
var formValidationSuccessMessage = document.getElementById('formValidationSuccessMessage');

var confirmUserCreationModal = document.getElementById('confirmUserCreationModal');
var confirmUserCreationOverLay = document.getElementById('confirmUserCreationOverLay');
var confirmUserCreationDialogbox = document.getElementById('confirmUserCreationDialogbox');

var createUserSuccessModal = document.getElementById('createUserSuccessModal');
var createUserSuccessOverLay = document.getElementById('createUserSuccessOverLay');
var createUserSuccessDialogbox = document.getElementById('createUserSuccessDialogbox');

var userCreationEmail = document.getElementById('userCreationEmail');
var userCreationFirstName = document.getElementById('userCreationFirstName');
var userCreationLastName = document.getElementById('userCreationLastName');
var userCreationIDNumber = document.getElementById('userCreationIDNumber');
var userCreationLevel = document.getElementById('userCreationLevel');
var userCreationDepartment = document.getElementById('userCreationDepartment');


function showCreateUserSuccessModal(successMessage) {
    formValidationSuccessMessage.innerHTML = successMessage;
    createUserSuccessModal.style.display = 'block';

    createUserSuccessOverLay.style.display = 'block';
    createUserSuccessOverLay.style.height = 2000+"px";

    createUserSuccessDialogbox.style.top = "100px";
    createUserSuccessDialogbox.style.display = "block";
    createUserSuccessDialogbox.style.position = "fixed";
}

function hideCreateUserSuccessModal(){
    createUserSuccessModal.style.display = 'none';
    createUserSuccessOverLay.style.display = "none";
    createUserSuccessDialogbox.style.display = "none";
    location.reload();
}

function showCreateUserFailedModalModal(errorMessage) {
    formValidationFailedMessage.innerHTML = errorMessage;
    createUserFailedModal.style.display = 'block';

    createUserFailedOverLay.style.display = 'block';
    createUserFailedOverLay.style.height = 2000+"px";

    createUserFailedDialogbox.style.top = "100px";
    createUserFailedDialogbox.style.display = "block";
    createUserFailedDialogbox.style.position = "fixed";
}

function hideCreateUserFailedModalModal(){
    createUserFailedModal.style.display = 'none';
    createUserFailedOverLay.style.display = "none";
    createUserFailedDialogbox.style.display = "none";
}

function showConfirmUserCreationModal(iEmail, iFirstName, iLastName, iEmpID, iLevel, iDepartment) {

    userCreationEmail.innerHTML = iEmail;
    userCreationFirstName.innerHTML = iFirstName;
    userCreationLastName.innerHTML = iLastName;
    userCreationIDNumber.innerHTML = iEmpID;
    userCreationLevel.innerHTML = iLevel;
    userCreationDepartment.innerHTML = iDepartment;

    confirmUserCreationModal.style.display = 'block';

    confirmUserCreationOverLay.style.display = 'block';
    confirmUserCreationOverLay.style.height = 2000+"px";

    confirmUserCreationDialogbox.style.top = "100px";
    confirmUserCreationDialogbox.style.display = "block";
    confirmUserCreationDialogbox.style.position = "fixed";
}

function hideConfirmUserCreationModal(){
    confirmUserCreationModal.style.display = 'none';
    confirmUserCreationOverLay.style.display = "none";
    confirmUserCreationDialogbox.style.display = "none";
}

function validateUserCreation(){
    var userLevelSelect = document.getElementById('userLevel');
    var userDepartmentSelect = document.getElementById('userDepartment');

    if(document.getElementById('email').value === null || document.getElementById('email').value == ""){
        showCreateUserFailedModalModal('Email Address cannot be empty!');
    }else if(document.getElementById('passWord').value === null || document.getElementById('passWord').value == ""){
        showCreateUserFailedModalModal('Password cannot be empty!');
    }else if(document.getElementById('firstName').value === null || document.getElementById('firstName').value == ""){
        showCreateUserFailedModalModal('First Name cannot be empty!');
    }else if(document.getElementById('lastName').value === null || document.getElementById('lastName').value == ""){
        showCreateUserFailedModalModal('Last Name cannot be empty!');
    }else if(document.getElementById('empId').value === null || document.getElementById('empId').value == ""){
        showCreateUserFailedModalModal('Employee ID cannot be empty!');
    }else if(userLevelSelect.value === 'null' || userLevelSelect.value === "" || userLevelSelect.value === undefined){
        showCreateUserFailedModalModal('User Level cannot be empty!');
    }else if(userDepartmentSelect.value === 'null' && userLevelSelect.value == "Faculty"){
        showCreateUserFailedModalModal('Department cannot be empty!');
    }else if(userDepartmentSelect.value === 'null' && userLevelSelect.value == "Department Head"){
        showCreateUserFailedModalModal('Department cannot be empty!');
    }else{
        showConfirmUserCreationModal(document.getElementById('email').value, document.getElementById('firstName').value, document.getElementById('lastName').value, document.getElementById('empId').value, userLevelSelect.value, userDepartmentSelect.value);
    }

}

function createUser(){
    hideConfirmUserCreationModal();
    var data = {
        email: document.getElementById('email').value,
        passWord: document.getElementById('passWord').value,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        empId: document.getElementById('empId').value,
        userLevel: document.getElementById('userLevel').value,
        userDepartment: document.getElementById('userDepartment').value
    };

    $.ajax({
        type: 'POST',
        url: '/createusers',
        data: data,
        success: function(response) {
            if(response.status_code === 1) {
                showCreateUserFailedModalModal("User Email already exists!");
            } else if(response.status_code === 2) {
                showCreateUserFailedModalModal("User Employee ID already exists!");
            } else if(response.status_code === 0) {
                showCreateUserSuccessModal("User created successfully!");
            } else if(response.status_code === 3) {
                showCreateUserFailedModalModal("Employee must have a Department.");
            }
        },
        error: function (error) {
            console.error('AJAX error:', error);
        }
    });
}
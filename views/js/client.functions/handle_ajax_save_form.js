var modalFormName = document.getElementById('modalFormName');
var modalFormControlNumber = document.getElementById('modalFormControlNumber');

var savedModalFormName = document.getElementById('savedModalFormName');
var savedModalFormControlNumber = document.getElementById('savedModalFormControlNumber');

var formName = document.getElementById('formName');
var formControlNumber = document.getElementById('formControlNumber');

var formNameValue;
var formControlNumberValue;
var formValidationFailedMessage = document.getElementById('formValidationFailedMessage');

var confirmSaveFormModal = document.getElementById('confirmSaveFormModal');
var confirmSaveFormOverLay = document.getElementById('confirmSaveFormOverLay');
var confirmSaveFormDialogbox = document.getElementById('confirmSaveFormDialogbox');

var formSavedModal = document.getElementById('formSavedModal');
var formSavedOverLay = document.getElementById('formSavedOverLay');
var formSavedDialogbox = document.getElementById('formSavedDialogbox');

var formValidationFailedModal = document.getElementById('formValidationFailedModal');
var formValidationFailedOverLay = document.getElementById('formValidationFailedOverLay');
var formValidationFailedDialogbox = document.getElementById('formValidationFailedDialogbox');

function validateForm(){
    var formName = document.getElementById('formName').value;
    var formControlNumber = document.getElementById('formControlNumber').value;
    var formBody = document.getElementById('form-content').innerHTML;

    if(formName == "" || formName == null){
        showFormValidationFailedModal("Form name cannot be empty!");
    }else if(formControlNumber == "" || formControlNumber == null){
        showFormValidationFailedModal("Form Control Number cannot be empty!");
    }else if(formBody == "" || formBody == null){
        showFormValidationFailedModal("Form Body cannot be empty!");
    }else{
        showSaveFormModal();
    }
}

function showSaveFormModal() {
    formNameValue = formName.value;
    formControlNumberValue = formControlNumber.value;

    modalFormName.innerHTML = "Form Name: " + formNameValue;
    modalFormControlNumber.innerHTML = "Control Number: " + formControlNumberValue;

    confirmSaveFormModal.style.display = 'block';

    confirmSaveFormOverLay.style.display = 'block';
    confirmSaveFormOverLay.style.height = 2000+"px";

    confirmSaveFormDialogbox.style.top = "100px";
    confirmSaveFormDialogbox.style.display = "block";
    confirmSaveFormDialogbox.style.position = "fixed";
}

function hideSaveFormModal(){
    confirmSaveFormModal.style.display = 'none';
    confirmSaveFormOverLay.style.display = "none";
    confirmSaveFormDialogbox.style.display = "none";
}

function showFormValidationFailedModal(errorMessage) {
    formValidationFailedMessage.innerHTML = errorMessage;

    formValidationFailedModal.style.display = 'block';

    formValidationFailedOverLay.style.display = 'block';
    formValidationFailedOverLay.style.height = 2000+"px";

    formValidationFailedDialogbox.style.top = "100px";
    formValidationFailedDialogbox.style.display = "block";
    formValidationFailedDialogbox.style.position = "fixed";
}

function hideFormValidationFailedModal(){
    formValidationFailedModal.style.display = 'none';
    formValidationFailedOverLay.style.display = "none";
    formValidationFailedDialogbox.style.display = "none";
}

function showFormSavedModal(formName, formControlNumber) {
    savedModalFormName.innerHTML = "Form Name: " + formName;
    savedModalFormControlNumber.innerHTML = "Control Number: " + formControlNumber;

    formSavedModal.style.display = 'block';

    formSavedOverLay.style.display = 'block';
    formSavedOverLay.style.height = 2000+"px";

    formSavedDialogbox.style.top = "100px";
    formSavedDialogbox.style.display = "block";
    formSavedDialogbox.style.position = "fixed";
}

function hideFormSavedModal(){
    formSavedModal.style.display = 'none';
    formSavedOverLay.style.display = "none";
    formSavedDialogbox.style.display = "none";
    window.location.href = '/';
}

function saveForm() {
    hideSaveFormModal();
    clearSelection(null);
    //var formBody = document.getElementById('form-content').innerHTML;
    var formBody = document.getElementById('form-content');
    var formName = document.getElementById('formName').value;
    var formControlNumber = document.getElementById('formControlNumber').value;

    var inputFieldValuesJSON = [];
    formBody = elementToJson(formBody,inputFieldValuesJSON);

    getNewKeyID(formBody);

    if (formBody === null || formBody === "" || formName === null || formName === "" || formControlNumber === null || formControlNumber === "") {
        alert("Form Body, Form Name, or Form Control Number is empty!");
    } else {
        const data = {
            name: formName,
            formControlNumber: formControlNumber,
            formContent: formBody,
            formStatus: "Template"
        };

        $.ajax({
            type: 'POST',
            url: '/savecreatedform',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (data) {
                if (data.success) {
                    showFormSavedModal(formName, formControlNumber);
                } else if (data.status_code === 1) {
                    alert("Form name already exists. Proceed to view form templates to edit the form instead!");
                    window.location.reload();
                } else if(data.status_code === 2){
                    alert("Form Control Number already exists.");
                    window.location.reload();
                } else {
                    alert("Error in AJAX function.");
                }
            },
            error: function (error) {
                console.error('AJAX error:', error);
            }
        });
    }
}
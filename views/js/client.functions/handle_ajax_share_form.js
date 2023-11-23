var selectedEmailToShareTo;
var accessLevel;

var sharingMessage = document.getElementById('sharingMessage');

var shareFormModal = document.getElementById('shareFormModal');
var shareFormOverLay = document.getElementById('shareFormOverLay');
var shareFormDialogbox = document.getElementById('shareFormDialogbox');

var shareFormAlertModal = document.getElementById('shareFormAlertModal');
var shareFormAlertOverLay = document.getElementById('shareFormAlertOverLay');
var shareFormAlertDialogbox = document.getElementById('shareFormAlertDialogbox');


function showShareFormModal() {
    selectedEmailToShareTo = document.getElementById('employee_email').value;
    accessLevel = document.getElementById('accessLevel').value;

    sharingMessage.innerHTML = "Are you sure you want to share this form to " + selectedEmailToShareTo + " with " + accessLevel + " privileges?";
    shareFormModal.style.display = 'block';

    shareFormOverLay.style.display = 'block';
    shareFormOverLay.style.height = 2000+"px";

    shareFormDialogbox.style.top = "100px";
    shareFormDialogbox.style.display = "block";
    shareFormDialogbox.style.position = "fixed";
}

function hideShareFormModal(){
    shareFormModal.style.display = 'none';
    shareFormOverLay.style.display = "none";
    shareFormDialogbox.style.display = "none";
}

function shareForm(){
    selectedEmailToShareTo = document.getElementById('employee_email').value;
    selectedSharedUserPrivilege = document.getElementById('accessLevel').value

    if(!selectedEmailToShareTo){
        alert("Please enter an email to share the form to!");
    }else if(!empEmails.includes(selectedEmailToShareTo)){
        alert("Employee does not exist.");
    }else{

        const data = {
            shareTo: selectedEmailToShareTo,
            formControlNumber: formControlNumber,
            sharedUserPrivileges: selectedSharedUserPrivilege
        };

        $.ajax({
            type: 'PUT',
            url: '/shareform',
            data: data,
            success: function(response) {
                if (response.status_code === 1) {
                    alert("No user was selected to share the form.");
                } else if (response.status_code === 0) {
                    alert("You shared the file to " + selectedEmailToShareTo);
                    hideShareFormModal();
                } else if (response.status_code === 2){
                    alert("Could not insert shared user.");
                } else {
                    alert("AJAX error: ", error);
                }
            },
            error: function(error) {
                console.error('AJAX error:', error);
            }
        });
    }
}

function validateShareForm(){
    selectedEmailToShareTo = document.getElementById('employee_email').value;

    if(selectedEmailToShareTo.length <= 0){
        showShareFormAlertModal();
    }else{
        showShareFormModal();
    }
}

function showShareFormAlertModal() {
    shareFormAlertModal.style.display = 'block';

    shareFormAlertOverLay.style.display = 'block';
    shareFormAlertOverLay.style.height = 2000+"px";

    shareFormAlertDialogbox.style.top = "100px";
    shareFormAlertDialogbox.style.display = "block";
    shareFormAlertDialogbox.style.position = "fixed";
}

function hideShareFormAlertModal(){
    shareFormAlertModal.style.display = 'none';
    shareFormAlertOverLay.style.display = "none";
    shareFormAlertDialogbox.style.display = "none";
}

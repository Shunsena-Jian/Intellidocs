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
    var table11 = $('#sharedPeopleTable').DataTable();
    selectedEmailToShareTo = document.getElementById('employee_email').value;
    selectedSharedUserPrivilege = document.getElementById('accessLevel').value

    if(!selectedEmailToShareTo){
        alert("Please enter an email to share the form to!");
    }else if(!empEmails.includes(selectedEmailToShareTo)){
        alert("Employee does not exist.");
    }else{

        const data = {
            shareTo: selectedEmailToShareTo,
            userVersion: currentForm.user_version,
            formControlNumber: currentForm.form_control_number,
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

                    // Update the DataTable for both read and write users
                    var updatedReadData = response.latestReadUsers;
                    console.log(JSON.stringify(response.latestReadUsers));
                    var updatedWriteData = response.latestWriteUsers;
                    console.log(JSON.stringify(response.latestWriteUsers));

                    // Clear the table once
                    table11.clear().draw();

                    // Add rows for read users
                    updatedReadData.forEach(function(user) {
                        var curLine = [
                            user.first_name + " " + user.last_name,
                            user.email,
                            "Read Only",
                            `<a class="full-width-button w3-center all-caps" onclick="removeSharedUser('${user.email}')">Remove</a>`
                        ];
                        table11.row.add(curLine);
                    });

                    // Add rows for write users
                    updatedWriteData.forEach(function(user) {
                        var curLine = [
                            user.first_name + " " + user.last_name,
                            user.email,
                            "Edit",
                            `<a class="full-width-button w3-center all-caps" onclick="removeSharedUser('${user.email}')">Remove</a>`
                        ];
                        table11.row.add(curLine);
                    });

                    // Redraw the table once after adding all rows
                    table11.draw();
                } else if (response.status_code === 2) {
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

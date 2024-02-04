function validateAssignUsers(){
    if(document.getElementById('assign_user').value == "null" || document.getElementById('assign_user').value === null || document.getElementById('assign_user').value == ""){
        showGeneralErrorModal("Please assign a user.");
    }else{
        bridgeAssignUserModal();
    }
}

function bridgeAssignUserModal(){
    showGeneralConfirmationModal("Are you sure to assign " + document.getElementById('assign_user').value + " to this form?", assignUser);
}

function assignUser() {
    hideGeneralConfirmationModal();
    var table5 = $('#assignedUserTable').DataTable();

    if (!empEmails.includes(document.getElementById('assign_user').value)) {
        showGeneralErrorModal("Employee does not exist.");
    } else if (document.getElementById('formDetailsActivateSetting').innerHTML != "Active") {
        showGeneralErrorModal("Activate the form before assigning a user to the form!");
    }else {
        const data = {
            formName: currentForm.form_name,
            assignedUser: document.getElementById('assign_user').value,
            formControlNumber: formControlNumber
        };

        $.ajax({
            type: 'PUT',
            url: '/AJAX_assignUsers',
            data: data,
            success: function (response) {
                if (response.status_code === 1) {
                    showGeneralErrorModal("No user was assigned to the form");
                } else if (response.status_code === 0) {
                    showGeneralSuccessModal("You have assigned " + document.getElementById('assign_user').value + " in this form.");
                    var updatedData2 = response.allAssignedUsers;
                    table5.clear().draw();

                    for (var b = 0; b < updatedData2.length; b++) {
                        var curLine2 = [
                            updatedData2[b].email,
                            updatedData2[b].emp_id,
                            updatedData2[b].user_department,
                            updatedData2[b].first_name,
                            updatedData2[b].last_name,
                            `<a class="full-width-button w3-center all-caps" onclick="removeUser('${updatedData2[b].email}')">Unassign</a>`
                        ];
                        table5.row.add(curLine2).draw();
                    }
                } else {
                    showGeneralErrorModal("Error at AJAX function in assigning users.");
                }
            },
            error: function (error) {
                console.log("AJAX Error: " + error);
            }
        });
    }
}
function validateDepartmentAssignment(){
    if(document.getElementById('assignDepartment').value == "null" || document.getElementById('assignDepartment').value == null){
        showGeneralErrorModal("A department must be selected");
    }else{
        bridgeAssignDepartmentModal();
    }
}

function bridgeAssignDepartmentModal(){
    showGeneralConfirmationModal("Are you sure to assign " + document.getElementById('assignDepartment').value + " in this form?", assignDepartment);
}

function assignDepartment(){
    if(document.getElementById('formDetailsActivateSetting').innerHTML != "Active"){
        showGeneralErrorModal("Activate the form first before assigning a department to the form!");
        hideGeneralConfirmationModal();
    }else{
        hideGeneralConfirmationModal();
        var table6 = $('#assignedUserTable').DataTable();
        var data = {
            formName: currentForm.form_name,
            formControlNumber: currentForm.form_control_number,
            assignedDepartment: document.getElementById('assignDepartment').value
        };

        $.ajax({
            url: '/AJAX_assignDepartment',
            type: 'PUT',
            data: data,
            success: function(response){
                if(response.status_code === 0){
                    showGeneralSuccessModal("You have assigned " + document.getElementById('assignDepartment').value + " in this form.");
                    var updatedData3 = response.allAssignedUsers;
                    table6.clear().draw();

                    for(e=0; e < updatedData3.length; e++){
                        var curLine3 = [
                            updatedData3[e].email,
                            updatedData3[e].emp_id,
                            updatedData3[e].user_department,
                            updatedData3[e].first_name,
                            updatedData3[e].last_name,
                            `<a class="full-width-button w3-center all-caps" onclick="bridgeRemoveUserModal('${updatedData3[e].email}')">Unassign</a>`
                        ];
                        table6.row.add(curLine3).draw();
                    }
                }else if(response.status_code === 1){
                    showGeneralErrorModal("There was an error in assigning the department.");
                }
            }
        });
    }
}
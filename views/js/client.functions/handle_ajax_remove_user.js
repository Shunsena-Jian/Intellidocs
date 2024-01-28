function bridgeRemoveUserModal(unassignUser){
    setUserRemoval(unassignUser);
    showGeneralConfirmationModal("Are you sure you want to un-assign " + unassignUser + " from this form?", removeUser);
}

var unassignUser;

function setUserRemoval(unassignUser){
    this.unassignUser = unassignUser;
}

function removeUser() {
    hideGeneralConfirmationModal();
    var table4 = $('#assignedUserTable').DataTable();
    var data = {
        formName: currentForm.form_name,
        formControlNumber: currentForm.form_control_number
    };

    $.ajax({
        url: `/AJAX_removeUser/${unassignUser}`,
        type: 'PUT',
        data: data,
        success: function(response) {
            if(response.status_code === 0){
                showGeneralSuccessModal("You have removed " + unassignUser + " from this form.");
                var updatedData1 = response.allAssignedUsers;
                table4.clear().draw();

                for (var a = 0; a < updatedData1.length; a++) {
                    var curLine1 = [
                        updatedData1[a].email,
                        updatedData1[a].emp_id,
                        updatedData1[a].user_department,
                        updatedData1[a].first_name,
                        updatedData1[a].last_name,
                        `<a class="full-width-button w3-center all-caps" onclick="bridgeRemoveUserModal('${updatedData1[a].email}')">Unassign</a>`
                    ];
                    table4.row.add(curLine1).draw();
                }
            }else if(response.status_code === 1){
                showGeneralErrorModal("There was an error in unassigning the user.");
            }
        }
    });
}
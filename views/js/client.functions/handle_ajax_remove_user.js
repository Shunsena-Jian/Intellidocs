function removeUser(unassignUser) {
    var unassignMessage = "Are you sure to Unassign " + unassignUser +  " in this form.";
    var result = window.confirm(unassignMessage);

    if(!result){
    }else{
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
                    var updatedData1 = response.allAssignedUsers;
                    table4.clear().draw();

                    for (var a = 0; a < updatedData1.length; a++) {
                        var curLine1 = [
                            updatedData1[a].email,
                            updatedData1[a].emp_id,
                            updatedData1[a].user_department,
                            updatedData1[a].first_name,
                            updatedData1[a].last_name,
                            `<a class="full-width-button w3-center all-caps" onclick="removeUser('${updatedData1[a].email}')">Unassign</a>`
                        ];
                        table4.row.add(curLine1).draw();
                    }
                }else if(response.status_code === 1){
                    alert("There was an error in unassigning the user.");
                }
            }
        });
    }
}
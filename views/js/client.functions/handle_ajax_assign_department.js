function assignDepartment(){
    var chosenDepartment = document.getElementById('assignDepartment').value;
    var assignDepartmentMessage = "Are you sure to assign to " + chosenDepartment + " in this form?";
    var result = window.confirm(assignDepartmentMessage);

    if(!result){
    }else{
        var table6 = $('#assignedUserTable').DataTable();
        var data = {
            formName: currentForm.form_name,
            formControlNumber: currentForm.form_control_number,
            assignedDepartment: chosenDepartment
        };

        $.ajax({
            url: '/AJAX_assignDepartment',
            type: 'PUT',
            data: data,
            success: function(response){
                if(response.status_code === 0){
                    alert("You have assigned " + chosenDepartment + " in this form.");
                    var updatedData3 = response.allAssignedUsers;
                    table6.clear().draw();

                    for(e=0; e < updatedData3.length; e++){
                        var curLine3 = [
                            updatedData3[e].email,
                            updatedData3[e].emp_id,
                            updatedData3[e].user_department,
                            updatedData3[e].first_name,
                            updatedData3[e].last_name,
                            `<a class="full-width-button w3-center all-caps" onclick="removeUser('${updatedData3[e].email}')">Unassign</a>`
                        ];
                        table6.row.add(curLine3).draw();
                    }
                }else if(response.status_code === 1){
                    alert("There was an error in assigning the department.");
                }
            }
        });
    }

}
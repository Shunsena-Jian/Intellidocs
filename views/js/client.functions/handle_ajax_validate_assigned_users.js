function validateAssignUsers() {
    selectedUserToAssign = document.getElementById('assign_user').value;
    var table5 = $('#assignedUserTable').DataTable();

    if (!selectedUserToAssign) {
        alert("Please enter an email to assign the form to.");
    } else if (!empEmails.includes(selectedUserToAssign)) {
        alert("Employee does not exist.");
    } else {
        const data = {
            formName: currentForm.form_name,
            assignedUser: selectedUserToAssign,
            formControlNumber: formControlNumber
        };

        $.ajax({
            type: 'PUT',
            url: '/AJAX_assignUsers',
            data: data,
            success: function (response) {
                if (response.status_code === 1) {
                    alert("No user was assigned to the form");
                } else if (response.status_code === 0) {
                    alert("You have assigned " + selectedUserToAssign + " in this form.");
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
                    alert("Error at AJAX function in assigning users.");
                }
            },
            error: function (error) {
                console.log("AJAX Error: " + error);
            }
        });
    }
}
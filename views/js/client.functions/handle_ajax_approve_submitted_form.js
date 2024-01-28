function approveSubmittedForm(formOwner, formControlNumber){
    var data = {
        formOwner: formOwner,
        formControlNumber: formControlNumber
    };

    $.ajax({
        type: 'PUT',
        url: '/AJAX_approveSubmittedForm',
        data: data,
        success: function(response){
            if(response.status_code === 0){
                var updatedData9 = response.updatedForm1;
                table9.clear().draw();

                for(e=0; e < updatedData9.length; e++){
                    var approveButton = '';
                    var returnButton = '';
                    if (updatedData9[e].secretary_approval === "Approved"){
                        approveButton = 'Approved';
                        returnButton = 'Cannot Return';
                    } else if (updatedData9[e].secretary_approval === "Returned") {
                        approveButton = 'Cannot Approve';
                        returnButton = 'Returned';
                    } else if (updatedData9[e].dean_approval === "Approved"){
                        approveButton = 'Approved';
                        returnButton = 'Cannot Return';
                    } else if (updatedData9[e].dean_approval === "Returned"){
                        approveButton = 'Cannot Approve';
                        returnButton = 'Returned';
                    } else if (updatedData9[e].department_head_approval === "Approved"){
                        approveButton = 'Approved';
                        returnButton = 'Cannot Return';
                    } else if (updatedData9[e].department_head_approval === "Returned"){
                        approveButton = 'Cannot Approve';
                        returnButton = 'Returned';
                    } else {
                        approveButton = `<button class="w3-button w3-block w3-theme-dark" onclick="approveSubmittedForm('${updatedData9[e].form_owner}', '${String(updatedData9[e].form_control_number)}')">Approve Form</button>`;
                        returnButton = `<button class="w3-button w3-block w3-theme-dark" onclick="returnSubmittedForm('${updatedData9[e].form_owner}', '${String(updatedData9[e].form_control_number)}')">Return Form</button>`;
                    }
                    console.log("This is buttons: " + approveButton + returnButton);

                    var curLine9 = [
                        updatedData9[e].first_name,
                        updatedData9[e].last_name,
                        updatedData9[e].form_owner,
                        updatedData9[e].date_submitted,
                        updatedData9[e].time_saved,
                        updatedData9[e].form_status,
                        `<button class="w3-button w3-block w3-theme-dark" onclick="renderSubmittedForm('${updatedData9[e].form_owner}')">View</button>`,
                        approveButton,
                        returnButton
                    ];
                    table9.row.add(curLine9).draw();
                }

                var secretaryApproval = response.secretary_approval;
                var deanApproval = response.dean_approval;
                var departmentHeadApproval = response.department_head_approval;

                if(secretaryApproval == "Approved"){
                    document.getElementById("secretaryApproval").innerHTML = "Approved";
                }else if(secretaryApproval == "Returned"){
                    document.getElementById("secretaryApproval").innerHTML = "Returned";
                }else{
                    document.getElementById("secretaryApproval").innerHTML = "Not Approved";
                }

                if(deanApproval == "Approved"){
                    document.getElementById("deanApproval").innerHTML = "Approved";
                }else if(deanApproval == "Returned"){
                    document.getElementById("deanApproval").innerHTML = "Returned";
                }else{
                    document.getElementById("deanApproval").innerHTML = "Not Approved";
                }

                if(departmentHeadApproval == "Approved"){
                    document.getElementById("departmentHeadApproval").innerHTML = "Approved";
                }else if(departmentHeadApproval == "Returned"){
                    document.getElementById("departmentHeadApproval").innerHTML = "Returned";
                }else{
                    document.getElementById("departmentHeadApproval").innerHTML = "Not Approved";
                }

                alert("Submitted form was approved.");
            }else if(response.status_code === 1){
                alert("Error in approving the form.");
            }else if(response.status_code === 2){
                alert("Error in approving the form.");
            }
        }
    });
}
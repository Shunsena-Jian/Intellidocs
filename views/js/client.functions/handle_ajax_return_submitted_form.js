function returnSubmittedForm(formOwner, formControlNumber){
    var data = {
        formOwner: formOwner,
        formControlNumber: formControlNumber
    };

    $.ajax({
        type: 'PUT',
        url: '/AJAX_returnSubmittedForm',
        data: data,
        success: function(response){
            if(response.status_code === 0){
                var updatedData10 = response.updatedForm1;
                table10.clear().draw();

                for(e=0; e < updatedData10.length; e++){
                    var approveButton = '';
                    var returnButton = '';
                    if (updatedData10[e].secretary_approval === "Approved"){
                        approveButton = 'Approved';
                        returnButton = 'Cannot Return';
                    } else if (updatedData10[e].secretary_approval === "Returned") {
                        approveButton = 'Cannot Approve';
                        returnButton = 'Returned';
                    } else if (updatedData10[e].dean_approval === "Approved"){
                        approveButton = 'Approved';
                        returnButton = 'Cannot Return';
                    } else if (updatedData10[e].dean_approval === "Returned"){
                        approveButton = 'Cannot Approve';
                        returnButton = 'Returned';
                    } else if (updatedData10[e].department_head_approval === "Approved"){
                        approveButton = 'Approved';
                        returnButton = 'Cannot Return';
                    } else if (updatedData10[e].department_head_approval === "Returned"){
                        approveButton = 'Cannot Approve';
                        returnButton = 'Returned';
                    } else {
                        approveButton = `<button class="w3-button w3-block w3-theme-dark" onclick="approveSubmittedForm('${updatedData10[e].form_owner}', '${String(updatedData10[e].form_control_number)}')">Approve Form</button>`;
                        returnButton = `<button class="w3-button w3-block w3-theme-dark" onclick="returnSubmittedForm('${updatedData10[e].form_owner}', '${String(updatedData10[e].form_control_number)}')">Return Form</button>`;
                    }

                    var curLine10 = [
                        updatedData10[e].first_name,
                        updatedData10[e].last_name,
                        updatedData10[e].form_owner,
                        updatedData10[e].date_submitted,
                        updatedData10[e].time_saved,
                        updatedData10[e].form_status,
                        `<button class="w3-button w3-block w3-theme-dark" onclick="renderSubmittedForm('${updatedData10[e].form_owner}')">View</button>`,
                        approveButton,
                        returnButton
                    ];
                    table10.row.add(curLine10).draw();
                }

                var secretaryApproval = response.secretary_approval;
                var deanApproval = response.dean_approval;
                var departmentHeadApproval = response.department_head_approval;

                if(response.secretary_approval == "Approved"){
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
                showGeneralSuccessModal("Submitted form was returned.");
            } else if (response.status_code === 1){
                showGeneralErrorModal("Error in returning the form.");
            } else if (response.status_code === 2){
                showGeneralErrorModal("Error in  returning the form.");
            }
        }
    });
}
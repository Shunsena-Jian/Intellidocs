function renderSubmittedForm(formOwner){
    makeAllReadOnlyRecursive();

    var data = {
        formOwner: formOwner,
        formControlNumber: form_template.form_control_number
    };

    $.ajax({
        type: 'PUT',
        url: '/AJAX_renderSubmittedForm',
        data: data,
        success: function(response){
            if(response.status_code === 0){
                showGeneralSuccessModal("Submitted form of " + formOwner + " will be rendered");
                document.getElementById("enginePlaceHolder").innerHTML = response.formContent;
                var userApprovals = response.submittedForm;

                if(userApprovals.secretary_approval == "Approved"){
                    document.getElementById("secretaryApproval").innerHTML = "Approved";
                }else if(userApprovals.secretary_approval == "Returned"){
                    document.getElementById("secretaryApproval").innerHTML = "Returned";
                }else{
                    document.getElementById("secretaryApproval").innerHTML = "Not Approved";
                }

                if(userApprovals.dean_approval == "Approved"){
                    document.getElementById("deanApproval").innerHTML = "Approved";
                }else if(userApprovals.dean_approval == "Returned"){
                    document.getElementById("deanApproval").innerHTML = "Returned";
                }else{
                    document.getElementById("deanApproval").innerHTML = "Not Approved";
                }

                if(userApprovals.department_head_approval == "Approved"){
                    document.getElementById("departmentHeadApproval").innerHTML = "Approved";
                }else if(userApprovals.department_head_approval == "Returned"){
                    document.getElementById("departmentHeadApproval").innerHTML = "Returned";
                }else{
                    document.getElementById("departmentHeadApproval").innerHTML = "Not Approved";
                }

                var table = $('#filesTable').DataTable();
                var updatedData = response.currentUserFiles;
                table.clear().draw();

                for(i=0;i<updatedData.length;i++){
                    console.log("found an object");

                    var curLine = [
                        updatedData[i].file_name,
                        updatedData[i].file_size,
                        updatedData[i].uploadedBy,
                        updatedData[i].uploadedAt,
                        `<a class="w3-half w3-hover-white edit-btn" href="/downloadfile/${updatedData[i].file_name}/${updatedData[i].uploadedBy}"><i class="fas fa-download"></i></a>
                        <a class="w3-half w3-hover-white" onclick="showDeleteModal('${updatedData[i].file_name}','${updatedData[i].uploadedBy}')"><i class="fa fa-times w3-text-theme"></i></a>`
                    ];

                    table.row.add(curLine).draw();
                }
            }else if(response.status_code === 1){
                showGeneralErrorModal("Error at rendering form");
            }
        },
    });
}
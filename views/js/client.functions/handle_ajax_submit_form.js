function submitForm(){
    var inputFieldValuesJSON = iterateAndGetData();
    var formBody = document.getElementById('form-content');

    formBody = elementToJson(formBody,inputFieldValuesJSON);
    getNewKeyID(formBody);

    const data = {
        formName: currentForm.form_name,
        formContent: formBody
    };

    $.ajax({
        type: 'PUT',
        url: '/submitform',
        data: data,
        success: function(response) {
            if (response.status_code === 1) {
                showGeneralErrorModal("Error in submitting the form.");
            } else if (response.status_code === 0) {
                showGeneralSuccessModal("Successfully submitted the form.");
                document.getElementById('form-content').innerHTML = response.initialTemplate;
                hideSaveFormModal();
                updateDropdownOptions(response.allUserFormVersions);

                var table1 = $('#previouslySubmittedForms').DataTable();
                var updatedData1 = response.prevSubmittedForms;
                table1.clear().draw();

                for(z=0; z < updatedData1.length; z++){
                    var curLine4 = [
                        updatedData1[z].form_name,
                        updatedData1[z].form_control_number,
                        updatedData1[z].time_saved,
                        updatedData1[z].date_submitted,
                        updatedData1[z].department_head_approval,
                        updatedData1[z].secretary_approval,
                        updatedData1[z].dean_approval,
                        `<button class="w3-button w3-block w3-theme-dark" onclick="renderPrevSubmittedForm('${updatedData1[z].form_owner}', '${updatedData1[z].user_version}')">View</button>`
                    ];
                    table1.row.add(curLine4).draw();
                }
            } else {
                $('.error-message').text(response.error);
            }
        },
        error: function(error) {
            console.error('AJAX error:', error);
        }
    });
}

function updateDropdownOptions(versions) {
    var dropdown = document.getElementById('versionDropDown');

    dropdown.innerHTML = '';

    versions.forEach(function(version) {
        var option = document.createElement('option');
        option.value = version;
        option.text = version;
        dropdown.add(option);
    });
}
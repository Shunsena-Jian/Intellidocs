function toggleActivateForm(){
    var confirmationMessage;

    if(currentForm.form_status == "Published"){
        confirmationMessage = "Are you sure you want to ACTIVATE the form?";
    }else if(currentForm.form_status == "Active"){
        confirmationMessage = "Are you sure you want to DE-ACTIVATE the form?";
    }else{
        confirmationMessage = "Are you sure you want to ACTIVATE the form?";
    }

    var result = window.confirm(confirmationMessage);

    if(result){
        if(toggleActivateFormButton.innerHTML == "Activate"){
            toggleActivateFormButton.innerHTML = "De-activate";
        }else{
            toggleActivateFormButton.innerHTML = "Activate";
        }
        AJAX_toggleActivate();
    }
}

function AJAX_toggleActivate(){
    var toggleActivateFormButton = document.getElementById("toggleActivateFormButton");
    var formDetailsActivateSetting = document.getElementById("formDetailsActivateSetting");

    var data = {
        formControlNumber: currentForm.form_control_number,
        targetedVersion: currentForm.form_version
    };

    $.ajax({
        type: 'PUT',
        url: '/AJAX_toggleActivate',
        data: data,
        success: function(response){
            if(response.status_code === 0){
                if(formDetailsActivateSetting.innerHTML == "Published"){
                    formDetailsActivateSetting.innerHTML = "Active";
                }else if(formDetailsActivateSetting.innerHTML == "Active"){
                    formDetailsActivateSetting.innerHTML = "In-active";
                }else{
                    formDetailsActivateSetting.innerHTML = "Active";
                }
            }else if(response.status_code === 1){
                alert("Failure did not GRADUATE");
            }else if(response.status_code === 2){
                alert("Server Failed");
            }
        }
    });
}
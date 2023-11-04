function saveFilledOutForm(){
    var formBody = document.getElementById('theContainerOfTheForm').innerHTML;

    const data = {
        formName: formBlock.form_name,
        formControlNumber: formBlock.form_control_number,
        formContent: formBody,
        formVersion: formBlock.form_version,
        formStatus: "On-going",
        formDateCreation: formBlock.date_created
    };

    $.ajax({
        type: 'POST',
        url: '/savefilledoutform',
        data: data,
        success: function(response) {
            if (response.status_code === 1) {
                alert("Error in saving the form.");
            } else if (response.status_code === 0) {
                alert("Successfully saved the form.");
            } else {
                $('.error-message').text(response.error);
            }
        },
        error: function(error) {
            console.error('AJAX error:', error);
        }
    });
}


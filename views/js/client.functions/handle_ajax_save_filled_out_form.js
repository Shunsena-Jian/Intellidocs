function saveFilledOutForm(){
    var formBody = document.getElementById('theContainerOfTheForm').innerHTML;

    const data = {
        formContent: formBody
    };

    $.ajax({
        type: 'PUT',
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


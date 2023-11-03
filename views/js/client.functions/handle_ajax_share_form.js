$(function() {
    var allEmails = empEmails;
    $( "#employee_email" ).autocomplete({
        source: allEmails
    });
});

function shareForm(){
    const shareTo = document.getElementById('employee_email').value;


    if(!shareTo){
        alert("Please enter an email to share the form to!");
    } else {
        const data = {
            shared_to: shareTo
        };

        $.ajax({
            type: 'POST',
            url: '/shareForm',
            data: data,
            success: function(response) {
                if (response.status_code === 1) {
                    alert("No user was selected to share the form.");
                } else if (response.status_code === 1) {
                    // alert("New password and current password should not match.");
                    document.getElementById("error-message").innerHTML = "New password and current password should not match.";
                } else if (response.status_code === 2){
                    // alert("Incorrect Current Password");
                    document.getElementById("error-message").innerHTML = "Incorrect Current Password.";
                } else {
                    $('.error-message').text(response.error);
                }
            },
            error: function(error) {
                console.error('AJAX error:', error);
            }
        });
    }
}


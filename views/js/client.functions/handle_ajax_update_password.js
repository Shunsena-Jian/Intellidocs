var changePasswordModal = document.getElementById('changePasswordModal');

function showChangePasswordModal(){
    changePasswordModal.style.display = 'block';
}
function hideChangePasswordModal(){
    changePasswordModal.style.display = 'none';
}

function updatePassword() {

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if(newPassword != confirmPassword){
        // alert("New password does not match!");
        document.getElementById("error-message").innerHTML = "New password does not match.";
    }else if(!newPassword || !currentPassword || !confirmPassword){
        // alert("MUST FILL OUT ALL FIELDS!");
        document.getElementById("error-message").innerHTML = "Fill out all fields.";
    }else{
        const data = {
            currentPassword: currentPassword,
            newPassword: newPassword
        };

        $.ajax({
            type: 'POST',
            url: '/update-Password',
            data: data,
            success: function(response) {
                if (response.status_code === 0) {
                    // alert("Password has been updated!");
                    document.getElementById("error-message").innerHTML = "Password has been updated, you will be logged out in 2 seconds.";
                    setTimeout(function(){
                        window.location.href = '/logout';
                    }, 2000);
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



        var changePasswordModal = document.getElementById('changePasswordModal');

        function showChangePasswordModal(){
            changePasswordModal.style.display = 'block';
        }
        function hideChangePasswordModal(){
            changePasswordModal.style.display = 'none';
        }

    function updatePassword() {
        console.log("CALLED!@");
        //event.preventDefault();

        //const currentPassword = $('#currentPassword').val();
        //const newPassword = $('#newPassword').val();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if(newPassword != confirmPassword){
            alert("New password does not match!");
            hideChangePasswordModal();
        }else if(!newPassword || !currentPassword || !confirmPassword){
            alert("MUST FILL OUT ALL FIELDS!");
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
                        window.location.href = '/logout';
                    } else if (response.status_code === 1) {
                        alert("Incorrect Current Password");
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

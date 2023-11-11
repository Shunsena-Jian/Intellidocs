var selectedEmailToShareTo;
var accessLevel;

var sharingMessage = document.getElementById('sharingMessage');
var shareFormModal = document.getElementById('shareFormModal');
var shareFormOverLay = document.getElementById('shareFormOverLay');
var shareFormDialogbox = document.getElementById('shareFormDialogbox');


function showShareFormModal() {
    selectedEmailToShareTo = document.getElementById('employee_email').value;
    accessLevel = document.getElementById('accessLevel').value;

    sharingMessage.innerHTML = "Are you sure you want to share this form to " + selectedEmailToShareTo + " with " + accessLevel + " privileges?";
    shareFormModal.style.display = 'block';

    document.getElementById('shareFormOverLay').style.display = 'block';
    shareFormOverLay.style.height = 2000+"px";

    shareFormDialogbox.style.top = "100px";
    shareFormDialogbox.style.display = "block";
    shareFormDialogbox.style.position = "fixed";
}

function hideShareFormModal(){
    shareFormModal.style.display = 'none';
    shareFormOverLay.style.display = "none";
    shareFormDialogbox.style.display = "none";
}

function shareForm(){
    selectedEmailToShareTo = document.getElementById('employee_email').value;

    if(!shareTo){
        alert("Please enter an email to share the form to!");
    } else {
        const data = {
            shareTo: selectedEmailToShareTo,
            formControlNumber: formBlock.form_control_number
        };

        $.ajax({
            type: 'POST',
            url: '/shareform',
            data: data,
            success: function(response) {
                if (response.status_code === 1) {
                    alert("No user was selected to share the form.");
                } else if (response.status_code === 0) {
                    hideShareFormModal();
                    alert("You shared the file to " + shareTo);
                } else {
                    alert("AJAX error: ", error);
                }
            },
            error: function(error) {
                console.error('AJAX error:', error);
            }
        });
    }
}

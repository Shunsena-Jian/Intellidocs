var saveFormModal = document.getElementById('saveFormModal');
var saveFormModalOverLay = document.getElementById('saveFormModalOverLay');
var saveFormModalDialogbox = document.getElementById('saveFormModalDialogbox');

function showSaveFormModal() {
    saveFormModal.style.display = 'block';

    saveFormModalOverLay.style.display = 'block';
    saveFormModalOverLay.style.height = 2000+"px";

    saveFormModalDialogbox.style.top = "100px";
    saveFormModalDialogbox.style.display = "block";
    saveFormModalDialogbox.style.position = "fixed";
}

function hideSaveFormModal(){
    saveFormModal.style.display = 'none';
    saveFormModalOverLay.style.display = "none";
    saveFormModalDialogbox.style.display = "none";
}


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
                updateDropdownOptions(response.allUserFormVersions);
                alert("Successfully saved the form.");
                hideSaveFormModal();
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

    // Clear existing options
    dropdown.innerHTML = '';

    // Add new options based on the received versions
    versions.forEach(function(version) {
        var option = document.createElement('option');
        option.value = version;
        option.text = version;
        dropdown.add(option);
    });
}


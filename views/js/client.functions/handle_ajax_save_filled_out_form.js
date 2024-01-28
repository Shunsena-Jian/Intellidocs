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
    clearSelections();
    var inputFieldValuesJSON = iterateAndGetData();
    var formBody = document.getElementById('form-content');

    formBody = elementToJson(formBody,inputFieldValuesJSON);
    getNewKeyID(formBody);


    const data = {
        formContent: formBody
    };

    $.ajax({
        type: 'PUT',
        url: '/savefilledoutform',
        data: data,
        success: function(response) {
            if (response.status_code === 1) {
                showGeneralErrorModal("Error in saving the form.");
            } else if (response.status_code === 0) {
                hideSaveFormModal();
                updateDropdownOptions(response.allUserFormVersions);
                showGeneralSuccessModal("Successfully saved the form.");
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

function clearSelections() {
    const allTables = document.querySelectorAll('div table');
    allTables.forEach((table) => {
      const selected = table.querySelectorAll('.selectedCells');
      selected.forEach((cell) => cell.classList.remove('selectedCells'));
    });
}



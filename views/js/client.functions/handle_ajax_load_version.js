var selectedVersionToLoad;

var formRenderingMessage = document.getElementById('formRenderingMessage');

var loadVersionModal = document.getElementById('loadVersionModal');
var loadVersionOverLay = document.getElementById('loadVersionOverLay');
var loadVersionDialogbox = document.getElementById('loadVersionDialogbox');

function showLoadVersionModal() {
    selectedVersionToLoad = document.getElementById('versionDropDown').value;

    formRenderingMessage.innerHTML = "Are you sure you want to load version " + selectedVersionToLoad + " into the canvas? \nUnsaved changes will be lost.";

    loadVersionModal.style.display = 'block';

    loadVersionOverLay.style.display = 'block';
    loadVersionOverLay.style.height = 2000+"px";

    loadVersionDialogbox.style.top = "100px";
    loadVersionDialogbox.style.display = "block";
    loadVersionDialogbox.style.position = "fixed";
}

function hideLoadVersionModal(){
    loadVersionModal.style.display = 'none';
    loadVersionOverLay.style.display = "none";
    loadVersionDialogbox.style.display = "none";
}

function renderSelectedVersion(){
    var userVersionChoice = document.getElementById("versionDropDown").value;

    const data = {
        formControlNumber: formControlNumber,
        userVersionChoice: userVersionChoice
    };

    $.ajax({
        type: 'PUT',
        url: '/AJAX_formUserViewVersion',
        data: data,
        success: function(response) {
            if (response.status_code === 0) {
                // modal success
                document.getElementById("enginePlaceHolder").innerHTML = response.formContent;
                hideLoadVersionModal();
            } else if (response.status_code === 1){
                // modal error
                alert("Error in Viewing Chosen Version");
            } else {
                // modal error
                alert("AJAX Error");
            }
        },
        error: function(error){
            console.error('AJAX Error: ', error);
        }
    });
}
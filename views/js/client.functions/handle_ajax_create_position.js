var confirmPositionCreationModal = document.getElementById('confirmPositionCreationModal');
var confirmPositionCreationOverLay = document.getElementById('confirmPositionCreationOverLay');
var confirmPositionCreationDialogbox = document.getElementById('confirmPositionCreationDialogbox');
var creationPosition = document.getElementById('creationPosition');

function validatePosition(){
    if(document.getElementById('userPosition').value === null || document.getElementById('userPosition').value == ""){
        showCreateUserFailedModalModal("Position cannot be empty!");
    }else{
        showConfirmPositionCreationModal();
    }
}

function showConfirmPositionCreationModal() {
    creationPosition.innerHTML = "Are you sure you want to create a new position for : " + document.getElementById('userPosition').value;
    confirmPositionCreationModal.style.display = 'block';

    confirmPositionCreationOverLay.style.display = 'block';
    confirmPositionCreationOverLay.style.height = 2000+"px";

    confirmPositionCreationDialogbox.style.top = "100px";
    confirmPositionCreationDialogbox.style.display = "block";
    confirmPositionCreationDialogbox.style.position = "fixed";
}

function hideConfirmPositionCreationModal(){
    confirmPositionCreationModal.style.display = 'none';
    confirmPositionCreationOverLay.style.display = "none";
    confirmPositionCreationDialogbox.style.display = "none";
}

function createUserPosition(){
    hideConfirmPositionCreationModal();
    var data = {
        newPosition: document.getElementById('userPosition').value
    };

    $.ajax({
        type: 'PUT',
        url: '/AJAX_newPosition',
        data: data,
        success: function(response){
            if(response.status_code === 0){
                showCreateUserSuccessModal("Position added successfully!");
            } else if(response.status_code === 1){
                showCreateUserFailedModalModal("Position already exists.");
            }
        },
        error: function(error){
            console.error('AJAX error in creating new position: ' + error);
            alert('AJAX error in creating new position: ' + error);
        }
    });
}
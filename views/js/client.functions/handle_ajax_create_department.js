var confirmDepartmentCreationModal = document.getElementById('confirmDepartmentCreationModal');
var confirmDepartmentCreationOverLay = document.getElementById('confirmDepartmentCreationOverLay');
var confirmDepartmentCreationDialogbox = document.getElementById('confirmDepartmentCreationDialogbox');
var creationDepartment = document.getElementById('creationDepartment');

function validateDepartment(){
    if(document.getElementById('newDepartment').value === null || document.getElementById('newDepartment').value == ""){
        showCreateUserFailedModalModal("Department cannot be empty!");
    }else{
        showConfirmDepartmentCreationModal();
    }
}

function showConfirmDepartmentCreationModal() {
    creationDepartment.innerHTML = "Are you sure you want to create a new department for : " + document.getElementById('newDepartment').value;
    confirmDepartmentCreationModal.style.display = 'block';

    confirmDepartmentCreationOverLay.style.display = 'block';
    confirmDepartmentCreationOverLay.style.height = 2000+"px";

    confirmDepartmentCreationDialogbox.style.top = "100px";
    confirmDepartmentCreationDialogbox.style.display = "block";
    confirmDepartmentCreationDialogbox.style.position = "fixed";
}

function hideConfirmDepartmentCreationModal(){
    confirmDepartmentCreationModal.style.display = 'none';
    confirmDepartmentCreationOverLay.style.display = "none";
    confirmDepartmentCreationDialogbox.style.display = "none";
}

function createDepartment(){
    hideConfirmDepartmentCreationModal();
    var data = {
        newDepartment: document.getElementById('newDepartment').value
    };

    $.ajax({
        type: 'PUT',
        url: '/AJAX_newDepartment',
        data: data,
        success: function(response){
            if(response.status_code === 0){
                showCreateUserSuccessModal("Department added successfully!");
            } else if(response.status_code === 1){
                showCreateUserFailedModalModal("Department already exists!");
            }
        },
        error: function(error){
            console.error('AJAX error in creating new position: ' + error);
            alert('AJAX error in creating new position: ' + error);
        }
    });
}
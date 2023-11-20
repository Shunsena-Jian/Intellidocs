var selectedFileForDeletion;

function showDeleteModal(fileName,fileOwner) {
    selectedFileForDeletion = fileName;
    selectedFileOwner = fileOwner;

    var deleteFileModal = document.getElementById('deleteFileModal');
    deleteFileModal.style.display = 'block';

    var deleteFileOverLay = document.getElementById('deleteFileOverLay');
    deleteFileOverLay.style.height = 2000+"px";
    document.getElementById('deleteFileOverLay').style.display = 'block';

    var deleteFileDialogbox = document.getElementById('deleteFileDialogbox');
    deleteFileDialogbox.style.top = "100px";
    deleteFileDialogbox.style.display = "block";
    deleteFileDialogbox.style.position = "fixed";
}

function deleteSelectedFile(){
    deleteFile(selectedFileForDeletion, selectedFileOwner);
}

function hideDeleteModal(){
    var deleteFileModal = document.getElementById('deleteFileModal');
    deleteFileModal.style.display = 'none';

    var deleteFileOverLay = document.getElementById('deleteFileOverLay');
    deleteFileOverLay.style.display = "none";

    var deleteFileDialogbox = document.getElementById('deleteFileDialogbox');
    deleteFileDialogbox.style.display = "none";
}

function deleteFile(fileName, fileOwner) {
    var table = $('#filesTable').DataTable();

    $.ajax({
        url: `/ajaxdelete/${fileName}/${fileOwner}`,
        type: 'delete',
        success: function(data) {
            console.log('File deleted successfully!');
            console.log(data.documents);

            var updatedData = data.documents;
            table.clear().draw();

            for(i=0;i<updatedData.length;i++){
                console.log("found an object");

                var curLine = [
                    updatedData[i].file_name,
                    updatedData[i].file_size,
                    updatedData[i].uploadedBy,
                    updatedData[i].uploadedAt,
                    `<a class="w3-half w3-hover-white edit-btn" href="/downloadfile/${updatedData[i].file_name}/${updatedData[i].uploadedBy}"><i class="fas fa-download"></i></a>
                    <a class="w3-half w3-hover-white" onclick="showDeleteModal('${updatedData[i].file_name}','${updatedData[i].uploadedBy}')"><i class="fa fa-times w3-text-theme"></i></a>`
                ];
                table.row.add(curLine).draw();
            }

            hideDeleteModal();
        },
        error: function(err) {
        console.error('Error deleting file: ', err.responseText);
        }
    });
}
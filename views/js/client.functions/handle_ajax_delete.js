var selectedFileForDeletion;

function showDeleteModal(fileName) {
    selectedFileForDeletion = fileName;
    document.getElementById('id01').style.display = 'block';
}

function deleteSelectedFile(){
    deleteFile(selectedFileForDeletion);
}

function closeModal(){
    document.getElementById('id01').style.display = 'none';
}

function deleteFile(fileName) {
    var table = $('#filesTable').DataTable();

    $.ajax({
        url: `/ajaxdelete/${fileName}`,
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
                    `<a class="w3-half w3-hover-white edit-btn" href="/downloadfile/${updatedData[i].file_name}"><i class="fa fa-pencil w3-text-theme"></i></a>
                    <a class="w3-half w3-hover-white" onclick="showDeleteModal('${updatedData[i].file_name}')"><i class="fa fa-times w3-text-theme"></i></a>`
                ];
                table.row.add(curLine).draw();
            }

            closeModal();
        },
        error: function(err) {
        console.error('Error deleting file: ', err.responseText);
        }
    });
}
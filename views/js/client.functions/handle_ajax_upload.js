$(document).ready(function() {
    var table = $('#filesTable').DataTable();
    $('#upload-form').on('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);

        $.ajax({
            url: '/',
            type: 'POST',
            data: formData,
            success: function(data) {
                console.log('File uploaded successfully!');
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
            },
            error: function(err) {
                console.error('Error uploading file: ', err.responseText);
            },
            cache: false,
            contentType: false,
            processData: false
        });
    });
});
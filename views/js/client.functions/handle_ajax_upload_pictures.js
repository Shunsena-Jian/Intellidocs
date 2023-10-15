$(document).ready(function() {
    $('#upload-picture').on('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);

        var newImageSrc = "";
        const imageElement = document.getElementById('sideBarImage');



        $.ajax({
            url: '/accountsettings',
            type: 'POST',
            data: formData,
            success: function(data) {
                alert('Picture uploaded successfully!\n You must refresh to view changes.');

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
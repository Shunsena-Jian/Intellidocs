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
                console.log('Picture uploaded successfully!');
                console.log(data.uploadedPictureDirectory);
                imageElement.src = data;
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
var confirmWidgetCreationModal = document.getElementById('confirmWidgetCreationModal');
var confirmWidgetCreationOverLay = document.getElementById('confirmWidgetCreationOverLay');
var confirmWidgetCreationDialogbox = document.getElementById('confirmWidgetCreationDialogbox');
var creationWidgetName = document.getElementById('creationWidgetName');
var creationWidgetMessage = document.getElementById('creationWidgetMessage');

var createWidgetFailedModal = document.getElementById('createWidgetFailedModal');
var createWidgetFailedOverLay = document.getElementById('createWidgetFailedOverLay');
var createWidgetFailedDialogbox = document.getElementById('createWidgetFailedDialogbox');
var widgetValidationFailedMessage = document.getElementById('widgetValidationFailedMessage');

var createWidgetSuccessModal = document.getElementById('createWidgetSuccessModal');
var createWidgetSuccessOverLay = document.getElementById('createWidgetSuccessOverLay');
var createWidgetSuccessDialogbox = document.getElementById('createWidgetSuccessDialogbox');

function validateWidget(){
    if(document.getElementById('widgetName').value === null || document.getElementById('widgetName').value == ""){
        showFailedWidgetCreationModal("Widget name cannot be empty!");
    }else if(document.getElementById('widgetCategory').value === null || document.getElementById('widgetCategory').value == "null" || document.getElementById('widgetCategory').value == ""){
        showFailedWidgetCreationModal("Widget type cannot be empty!");
    }else{
        showConfirmWidgetCreationModal();
    }
}

function showSuccessWidgetCreationModal() {
    createWidgetSuccessModal.style.display = 'block';

    createWidgetSuccessOverLay.style.display = 'block';
    createWidgetSuccessOverLay.style.height = 2000+"px";

    createWidgetSuccessDialogbox.style.top = "100px";
    createWidgetSuccessDialogbox.style.display = "block";
    createWidgetSuccessDialogbox.style.position = "fixed";
}

function hideSuccessWidgetCreationModal(){
    createWidgetSuccessModal.style.display = 'none';
    createWidgetSuccessOverLay.style.display = "none";
    createWidgetSuccessDialogbox.style.display = "none";
    window.location.href = '/';
}

function showFailedWidgetCreationModal(errorMessage) {
    widgetValidationFailedMessage.innerHTML = errorMessage;
    createWidgetFailedModal.style.display = 'block';

    createWidgetFailedOverLay.style.display = 'block';
    createWidgetFailedOverLay.style.height = 2000+"px";

    createWidgetFailedDialogbox.style.top = "100px";
    createWidgetFailedDialogbox.style.display = "block";
    createWidgetFailedDialogbox.style.position = "fixed";
}

function hideFailedWidgetCreationModal(){
    createWidgetFailedModal.style.display = 'none';
    createWidgetFailedOverLay.style.display = "none";
    createWidgetFailedDialogbox.style.display = "none";
}

function showConfirmWidgetCreationModal() {
    creationWidgetName.innerHTML = "Are you sure you want to create a widget named : " + document.getElementById('widgetName').value;
    creationWidgetMessage.innerHTML = "This widget can be viewed and accessed when creating new forms or viewing templates in the : " + document.getElementById('widgetCategory').value + " section.";

    confirmWidgetCreationModal.style.display = 'block';

    confirmWidgetCreationOverLay.style.display = 'block';
    confirmWidgetCreationOverLay.style.height = 2000+"px";

    confirmWidgetCreationDialogbox.style.top = "100px";
    confirmWidgetCreationDialogbox.style.display = "block";
    confirmWidgetCreationDialogbox.style.position = "fixed";
}

function hideConfirmWidgetCreationModal(){
    confirmWidgetCreationModal.style.display = 'none';
    confirmWidgetCreationOverLay.style.display = "none";
    confirmWidgetCreationDialogbox.style.display = "none";
}

function createWidget(){
    hideConfirmWidgetCreationModal();
    clearSelection(null);
    var outerContainer = "";
    var widgetCanvas = document.getElementById('widgetCanvas').innerHTML;
    outerContainer = `<div class="w3-row draggable box w3-margin-small" draggable="true"> ` +
            widgetCanvas + `<div>`;
    var widgetName = document.getElementById('widgetName').value;
    var widgetCategory = document.getElementById('widgetCategory').value;

    if(widgetName === null || widgetName === undefined || widgetName === ""){
        showFailedWidgetCreationModal("Widget name cannot be empty!");
    } else {
        const data = {
            name: widgetName,
            category: widgetCategory,
            widgetContent: outerContainer
        };

        fetch('/savecreatedwidget', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Network response was not ok');
            }
        }).then(data => {
            const success = data.success; // Assuming the response contains a 'success' property
            if (success) {
                showSuccessWidgetCreationModal();
            } else {
            }
        }).catch(error => {
            console.error('Fetch error:', error);
        });
    }
}
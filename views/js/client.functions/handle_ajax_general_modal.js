var generalConfirmationModal = document.getElementById('generalConfirmationModal');
var generalConfirmationModalOverlay = document.getElementById('generalConfirmationModalOverlay');
var generalConfirmationModalDialogBox = document.getElementById('generalConfirmationModalDialogBox');
var generalConfirmationModalMessage = document.getElementById('generalConfirmationModalMessage');
var generalConfirmationModalYes = document.getElementById('generalConfirmationModalYes');

var generalErrorModal = document.getElementById('generalErrorModal');
var generalErrorOverLay = document.getElementById('generalErrorOverLay');
var generalErrorDialogbox = document.getElementById('generalErrorDialogbox');
var generalErrorMessage = document.getElementById('generalErrorMessage');

var generalSuccessModal = document.getElementById('generalSuccessModal');
var generalSuccessOverLay = document.getElementById('generalSuccessOverLay');
var generalSuccessDialogbox = document.getElementById('generalSuccessDialogbox');
var generalSuccessMessage = document.getElementById('generalSuccessMessage');


function showGeneralConfirmationModal(generalModalMessage, generalModalYesFunction){
    generalConfirmationModalMessage.innerHTML = generalModalMessage;
    generalConfirmationModalYes.onclick = generalModalYesFunction;

    generalConfirmationModal.style.display = 'block';

    generalConfirmationModalOverlay.style.display = 'block';
    generalConfirmationModalOverlay.style.height = 2000+"px";

    generalConfirmationModalDialogBox.style.top = "100px";
    generalConfirmationModalDialogBox.style.display = "block";
    generalConfirmationModalDialogBox.style.position = "fixed";
}

function hideGeneralConfirmationModal(){
    generalConfirmationModal.style.display = 'none';
    generalConfirmationModalOverlay.style.display = "none";
    generalConfirmationModalDialogBox.style.display = "none";
    generalConfirmationModalYes.onclick = null;
}

function showGeneralErrorModal(modalErrorMessage){
    generalErrorMessage.innerHTML = modalErrorMessage;

    generalErrorModal.style.display = 'block';

    generalErrorOverLay.style.display = 'block';
    generalErrorOverLay.style.height = 2000+"px";

    generalErrorDialogbox.style.top = "100px";
    generalErrorDialogbox.style.display = "block";
    generalErrorDialogbox.style.position = "fixed";
}

function hideGeneralErrorModal(){
    generalErrorModal.style.display = 'none';
    generalErrorOverLay.style.display = "none";
    generalErrorDialogbox.style.display = "none";
}

function showGeneralSuccessModal(modalSuccessMessage){
    generalSuccessMessage.innerHTML = modalSuccessMessage;

    generalSuccessModal.style.display = 'block';

    generalSuccessOverLay.style.display = 'block';
    generalSuccessOverLay.style.height = 2000+"px";

    generalSuccessDialogbox.style.top = "100px";
    generalSuccessDialogbox.style.display = "block";
    generalSuccessDialogbox.style.position = "fixed";
}

function hideGeneralSuccessModal(){
    generalSuccessModal.style.display = 'none';
    generalSuccessOverLay.style.display = "none";
    generalSuccessDialogbox.style.display = "none";
}


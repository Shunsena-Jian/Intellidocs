var selectedAnchor;

var confirmLeavePageModal = document.getElementById('confirmLeavePageModal');
var confirmLeavePageOverLay = document.getElementById('confirmLeavePageOverLay');
var confirmLeavePageDialogbox = document.getElementById('confirmLeavePageDialogbox');

function showLeavePageModal(receivedAnchor, receivedPage) {
    selectedAnchor = receivedAnchor;
    //alert(receivedPage);
    if(receivedPage == "formview"){
        confirmLeavePageModal.style.display = 'block';

        confirmLeavePageOverLay.style.display = 'block';
        confirmLeavePageOverLay.style.height = 2000+"px";

        confirmLeavePageDialogbox.style.top = "100px";
        confirmLeavePageDialogbox.style.display = "block";
        confirmLeavePageDialogbox.style.position = "fixed";
    }else{
        goToSelectedAnchor();
    }
}

function hideLeavePageModal(){
    confirmLeavePageModal.style.display = 'none';
    confirmLeavePageOverLay.style.display = "none";
    confirmLeavePageDialogbox.style.display = "none";
}

function goToSelectedAnchor(){
    window.location.href = selectedAnchor;
}
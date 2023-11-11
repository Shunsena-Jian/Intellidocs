var idleTimeOut;
var idleModal = document.getElementById('idleModal');
var idleOverLay = document.getElementById('idleOverLay');
var idleDialogbox = document.getElementById('idleDialogbox');
var countDownPlaceholder = document.getElementById('countDownPlaceholder');

function resetIdleTimeOut(){
    clearTimeout(idleTimeOut);
    idleTimeOut = setTimeout(alertIdle, min_handlingTime);
}

resetIdleTimeOut();
document.addEventListener("mousemove", resetIdleTimeOut);
document.addEventListener("keydown", resetIdleTimeOut);

function alertIdle(){
    if(clientConnectionStatus == false){
        resetIdleTimeOut();
    }else{
        showIdleModal();
    }
}

function showIdleModal(){
    idleModal.style.display = 'block';
    idleOverLay.style.height = 2000+"px";

    document.getElementById('idleOverLay').style.display = 'block';

    idleDialogbox.style.top = "100px";
    idleDialogbox.style.display = "block";
    idleDialogbox.style.position = "fixed";

    countDown();
}

function hideIdleModal(){
    stopCountDown();

    idleModal.style.display = 'none';
    idleOverLay.style.display = "none";
    idleDialogbox.style.display = "none";
}

var countDownIntervalHolder;

function countDown(){
    countDownIntervalHolder = setInterval(updateCountDownElement, 1000);
}

var initialTimeOut = 60;

function updateCountDownElement(){
    countDownPlaceholder.innerHTML = 'For your security, we will automatically log you out in ' + initialTimeOut + ' seconds.';

    console.log("logging off in: " + initialTimeOut);
    initialTimeOut = initialTimeOut - 1;
    if(initialTimeOut == 0){
        window.location.replace("/logout");
    }
}

hideIdleModal();

function logUserOff(){
    window.location.replace("/logout");
}

function stopCountDown(){
    clearInterval(countDownIntervalHolder);
    initialTimeOut = 60;
}







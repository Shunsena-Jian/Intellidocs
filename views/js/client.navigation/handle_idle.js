var idleTimeOut;

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
    var idleModal = document.getElementById('idleModal');
    idleModal.style.display = 'block';

    let dialogoverlay = document.getElementById('dialogoverlay');
    let dialogbox = document.getElementById('dialogbox');

    let winH = window.innerHeight;
    dialogoverlay.style.height = winH+"px";
    dialogbox.style.top = "100px";
    dialogoverlay.style.display = "block";
    dialogbox.style.display = "block";
    document.getElementById('dialogboxhead').style.display = 'block';
    countDown();
}

var countDownIntervalHolder;

function countDown(){
    countDownIntervalHolder = setInterval(updateCountDownElement, 1000);
}

var initialTimeOut = 60;

function updateCountDownElement(){
    var countDownPlaceholder = document.getElementById('countDownPlaceholder');
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

function hideIdleModal(){
    stopCountDown();
    var idleModal = document.getElementById('idleModal');
    idleModal.style.display = 'none';

    let dialogoverlay = document.getElementById('dialogoverlay');
    let dialogbox = document.getElementById('dialogbox');

    dialogoverlay.style.display = "none";
    dialogbox.style.display = "none";
    document.getElementById('dialogboxhead').style.display = 'none';
}





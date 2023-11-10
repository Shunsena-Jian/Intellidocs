hideStatusBar();
var loaderInterval = 0;

function updateReconnectBar() {
    var statusBar = document.getElementById("statusBar");
    var width = 15;

    if (loaderInterval == 0) {
        loaderInterval = 1;
        var id = setInterval(frame, 20);

        function frame() {
            if (width >= 100) {
                clearInterval(id);
                loaderInterval = 0;
            } else {
                width++;
                statusBar.style.width = width + "%";
            }
        }
    }
}

var loaderBarIntervalHolder;

function initiateLoaderBar(){
    loaderBarIntervalHolder = setInterval(updateReconnectBar,30);
}

function stopLoaderBar(){
    clearInterval(loaderBarIntervalHolder);
}

//socket script
const socket = io();
var clientConnectionStatus;

socket.on('connect', () => {
    console.log('Connected to WebSocket server');
    stopLoaderBar();
    stopReconnect();
    hideStatusBar();
    clientConnectionStatus = true;
});

socket.on('manualPong',(response) =>{
    console.log('Received server response:', response);
});

var reconnectIntervalHolder;
var clientReseated;

function initiateReconnect(){
    reconnectIntervalHolder = setInterval(attemptReconnectWrapper,3000);
}

function attemptReconnectWrapper(){
    if(!clientReseated){
        attemptReconnect(reconID);
    }
}

function stopReconnect(){
    clearInterval(reconnectIntervalHolder);
}

socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server');
    showStatusBar();
    clientConnectionStatus = false;
    clientReseated = false;

    setTimeout(() => {
        initiateReconnect();
        socket.connect();
        initiateLoaderBar();
    }, 3000);
});

function attemptReconnect(reconID) {
    console.log("attempting to reconnect " + reconID);
    $.ajax({
        url: `/reseat/${reconID}`,
        type: 'put',
        success: function(data) {
            console.log('Reseated session successfully!' + data);
            clientReseated = true;
        },
        error: function(error) {
            console.error('Error reconnecting: ' + error);
            clientReseated = false;
        }
    });
}

function showStatusBar(){
    var pageStatusBar = document.getElementById('pageStatusBar');
    var mySidebar = document.getElementById('mySidebar');

    pageStatusBar.style.display = 'block';
    mySidebar.style.top = '86px';
}

function hideStatusBar(){
    var pageStatusBar = document.getElementById('pageStatusBar');
    var mySidebar = document.getElementById('mySidebar');

    pageStatusBar.style.display = 'none';
    mySidebar.style.top = '43px';
}

//hideStatusBar();


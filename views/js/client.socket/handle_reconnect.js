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




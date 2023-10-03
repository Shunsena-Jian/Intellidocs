function openNavigation() {
    // Get the element by its ID
    const sidebar = document.getElementById("mySidebar");
    const main = document.getElementById("main");
    // Toggle the classes for showing/hiding the sidebar
    sidebar.classList.toggle("w3-show");
    // Toggle the margin of the main content
    main.style.marginLeft = "250px";
}

function toggleAccordion(id) {
    var x = document.getElementById(id);

    if (x.className.indexOf("w3-show") == -1) {
        x.className += " w3-show";
        x.previousElementSibling.className += " w3-theme-d1";
    } else {
        x.className = x.className.replace("w3-show", "");
        x.previousElementSibling.className.replace(" w3-theme-d1", "");
    }
}
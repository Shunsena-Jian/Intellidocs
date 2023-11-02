$(function() {
    var allEmails = empEmails;
    $( "#employee_email" ).autocomplete({
        source: allEmails
    });
});

function shareForm(){
    const shareTo = document.getElementById('employee_email').value;

    if(!shareTo){
        alert("Please enter an email to share the form to!");
    }
}


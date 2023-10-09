var createTemplateElement = document.getElementById("createTemplateElement");
var viewReportElement = document.getElementById("viewReportElement");
var addUserElement = document.getElementById("addUserElement");
var editUserElement = document.getElementById("editUserElement");
var userManagementElement = document.getElementById("userManagementElement");

function setUpFeatures(privileges){
    var setUpCreateTemplateElement = false;
    var setUpViewReportElement = false;
    var setUpAddUserElement = false;
    var setUpEditUserElement = false;

    for(i=0;i<privileges.length;i++){
        var currentPrivilege = privileges[i];

        if(currentPrivilege == "Create Templates"){
            setUpCreateTemplateElement = true;
            console.log("THIS USER CAN CREATE TEMPLATES");
        }else if(currentPrivilege == "View Reports"){
            setUpViewReportElement = true;
            console.log("THIS USER CAN VIEW REPORT");
        }else if(currentPrivilege == "Add User"){
            setUpAddUserElement = true;
            console.log("THIS USER CAN ADD USERS");
        }else if(currentPrivilege == "Edit User"){
            setUpEditUserElement = true;
            console.log("THIS USER CAN EDIT USERS");
        }
    }

    if(!setUpCreateTemplateElement){
        createTemplateElement.remove();
    }
    if(!setUpViewReportElement){
        viewReportElement.remove();
    }
    if(!setUpAddUserElement){
        addUserElement.remove();
    }
    if(!setUpEditUserElement){
        editUserElement.remove();
    }
    if(!setUpAddUserElement && !setUpEditUserElement){
        userManagementElement.remove();
    }
}

setUpFeatures(receivedUserPrivileges);
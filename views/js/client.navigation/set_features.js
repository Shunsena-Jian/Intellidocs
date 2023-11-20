var createTemplateElement = document.getElementById("createTemplateElement");
var addUserElement = document.getElementById("addUserElement");
var editUserElement = document.getElementById("editUserElement");
var userManagementElement = document.getElementById("userManagementElement");

function setUpFeatures(privileges){
    var setUpCreateTemplateElement = false;
    var setUpAddUserElement = false;
    var setUpEditUserElement = false;

    for(i=0;i<privileges.length;i++){
        var currentPrivilege = privileges[i];

        if(currentPrivilege == "Manage Templates"){
            setUpCreateTemplateElement = true;
            console.log("THIS USER CAN CREATE TEMPLATES");
        }else if(currentPrivilege == "User Management"){
            setUpAddUserElement = true;
            console.log("THIS USER CAN ADD USERS");
        }else if(currentPrivilege == "View Users"){
            setUpEditUserElement = true;
            console.log("THIS USER CAN EDIT USERS");
        }
    }

    if(!setUpCreateTemplateElement){
        createTemplateElement.remove();
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
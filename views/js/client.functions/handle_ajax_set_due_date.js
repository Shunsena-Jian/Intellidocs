function setDueDate(){
    var dueDateInput = document.getElementById("dueDateInput").value;

    if(dueDateInput == '' || dueDateInput == undefined || dueDateInput == null){
        alert("You did not set a due date.");
    }else{
        var dueDate = new Date(dueDateInput);
        var monthDue = getQuarter(dueDateInput);
        var annualDue = getAnnual(dueDateInput);
        var acadYear = getAcadYear(dueDateInput);
        var semester = getSemester(dueDateInput);

        var data = {
            dueDateInput: dueDateInput,
            quarterlyDueDate: monthDue,
            annualDueDate: annualDue,
            academicYear: acadYear,
            semester: semester,
            formControlNumber: form_template.form_control_number
        }

        $.ajax({
            type: 'PUT',
            url: '/AJAX_setDueDate',
            data: data,
            success: function(response){
                if(response.status_code === 0){
                    document.getElementById("formDueDateSetting").innerHTML = response.dueDate;
                    document.getElementById("dueDateH4").innerHTML = 'Due Date Set';
                    var dueDateContainer = document.getElementById("dueDateContainer");
                    var dueDateContainer1 = document.getElementById("dueDateContainer1");
                    dueDateContainer.remove();
                    dueDateContainer1.remove();
                    alert("Due date has been set.");
                }else if(response.status_code === 1){
                    alert("Error in setting a due date.");
                }else if(response.status_code === 2){
                    alert("Error in setting a due date.");
                }
            }
        });
    }
}

function getSemester(dueDate){
    const parts = dueDate.split('-');
    const month = parseInt(parts[1], 10);

    if(month >= 1 && month <= 5){
        return '2nd Semester';
    }else if (month >= 8 && month <= 12){
        return '1st Semester';
    }else if (month >= 6 && month <= 7){
        return 'Short Semester';
    }else {
        return 'Invalid Semester';
    }
}

function getAcadYear(dueDate){
    const parts = dueDate.split('-');
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[0], 10);
    var anotherYear;

    if(month >= 1 && month <= 7){
        anotherYear = year - 1;
        return anotherYear + ' - ' + year;
    }else if (month >= 8 && month <= 12){
        anotherYear = year + 1;
        return year + '-' + anotherYear;
    }else {
        return 'Invalid Academic Year';
    }
}

function getAnnual(dueDate){
    const parts = dueDate.split('-');
    const year = parseInt(parts[0], 10);
    return year;
}

function getQuarter(dueDate){
    const parts = dueDate.split('-');
    const month = parseInt(parts[1], 10);

    if(month >= 1 && month <= 3){
        return '1st Quarter';
    }else if (month >= 4 && month <= 6){
        return '2nd Quarter';
    }else if (month >= 7 && month <= 9){
        return '3rd Quarter';
    }else if (month >= 10 && month <= 12){
        return '4th Quarter';
    }else {
        return 'Invalid Quarterly Due Date';
    }
}
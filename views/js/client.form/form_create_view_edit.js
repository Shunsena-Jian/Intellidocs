// Global Variables
var activeDraggable;
var sectionCount;
var isFirstElement;
var currentPage;
var currentHeight;
var maxHeight;
var currentPageContent;
var containerDiv;
var header_height;
var tables;
var contextMenu;
var rightClickWidgetActive;
var selectedTextBox;
var userType;
var selectedCells;

// On load of page, initialize global variables
window.onload = function() {
    contextMenu = document.createElement('div');
    containerDiv = document.getElementById('outer-container');
    dropBox = document.querySelector('.drop-container');
    dropContainers = document.querySelectorAll('.drop-container');
    currentPageContent = document.querySelector('.drop-container');
    currentPage = dropContainers.length;
    tables = document.querySelectorAll('.form-table');
    activeDraggable = null;
    selectedCells = [];
    sectionCount = 0;
    maxHeight = 0;
    isFirstElement = true;
    maxHeight = setMaxHeight(); // set new max height
    header_height = 0; // calculate header height
    padding = 36;
    currentHeight = 0 + padding;
    rightClickWidgetActive = false;
    userType = window.userLevel; // User Level determines access to right click functions
    selectedTextBox = null; // Tracker for selected elements

    console.log("User Type is: " + userType);
    initializeDraggables();
    if (currentPageContent.childElementCount > 0) {
        initializeCurrentPage();
    }

    addEventListenerToDiv(currentPageContent);
    inputListeners();
};

function initializeDraggables() {
    var tables = document.querySelectorAll('.form-table');
    var boxes = document.querySelectorAll('.box');
    var draggables = document.querySelectorAll('.draggable');

    // Element Initialization
    // Allow selected draggable widget to be dragged. Upon dropping in the canvas, allow its HTML structure to be cloned
    tables.forEach((table) => {
        table.addEventListener('dragstart', handleDragStart);
    });


    boxes.forEach((box) => {
        box.addEventListener('dragstart', handleDragStart);
    });

}

function handleDragStart(e) {
    const widget = this; // 'this' will refer to the element the event listener is attached to
    console.log(widget);
    e.dataTransfer.setData('text/html', widget.outerHTML);
    activeDraggable = widget;
}

// Tnitialize current page upon load
function initializeCurrentPage(){
    console.log("re-initializing current page");
    var pagesParent = document.getElementById("form-content");
    var pagesChildren = pagesParent.children;
    var countOfPages = 0;

    for (var i = 0; i < pagesChildren.length; i++) {
        countOfPages = countOfPages + 1;
    }

    currentPage = countOfPages; // Sum how many drop-containers pages there is and set the last page as the current page

    initializeHeightOfCurrentPage(currentPage); // Calculate height of the last page
    initializeContextMenuForChildren(currentPage); // Enable right click functions for content
    makeAllReadOnlyRecursive();
}


function initializeHeightOfCurrentPage(currentPageValue){
    var receivedCurrentPage = "page-" + currentPageValue;
    var parentElement = document.getElementById(receivedCurrentPage);
    var children = parentElement.children;

    var currentPageHeight = 0;
    var countOfChildren = 0;
    for (var i = 0; i < children.length; i++) {
        countOfChildren = countOfChildren + 1;
        currentPageHeight = currentPageHeight + calculateDivHeight(children[i]); // Calculate div height of each section and sum
    }

    initializeDraggables();

    currentHeight = currentPageHeight;
    currentPageContent = parentElement; // update pointer
    addEventListenerToDiv(currentPageContent); // Enable dropping of elements on initialized page
}

// Starting point of activating right click functions for each element
function initializeContextMenuForChildren(pageCount){
    var receivedCurrentPage = "";
    var parentElement;
    var children;

    for(i = 1; i <= pageCount; i++){
        receivedCurrentPage = "page-" + i;
        parentElement = document.getElementById(receivedCurrentPage);
        children = parentElement.children;
        console.log(children);

        for(j = 0; j < children.length; j++){
            // Do not allow select element for other user types
            if (!(userType === "Secretary" || userType === "Department Head" || userType === "Dean")) {
               children[j].firstElementChild = selectElement(children[j].firstElementChild);
            }
            initializeContextMenuForChild(children[j].firstElementChild);

        }

        // Get all elements with class name "label"
        const elements = parentElement.querySelectorAll('.text-label');
        console.log(elements);

        // Loop through each element and add event listener
        elements.forEach(element => {
            // Add event listener for 'keydown' event
            element.addEventListener('keydown', () => {
                adjustTextareaHeight(element);
            });
        });
    }
}

// A branch of initializeContextMenuForChildren() function that calls the contextMenu
// listener respectively for each child section div
function initializeContextMenuForChild(clonedDiv) {
    console.log(clonedDiv);
    function addContextMenuListenerToElement(clonedDiv) {
        clonedDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            console.log("adding context listener to ");
            console.log(clonedDiv);
               try {
                    if (clonedDiv.classList.contains("form-table")) {
                       console.log("is a table");
                       createContextMenu(e.clientX, e.clientY, null, clonedDiv);
                   } else {
                       createContextMenu(e.clientX, e.clientY, clonedDiv, null);
                   }
               } catch {
                   // Error
               }
        });
    }

    function processChildElements(element) {
        addContextMenuListenerToElement(element);

        for (const child of element.children) {
            processChildElements(child);
            rightClickWidgetActive = false;
        }
    }

    // Add the listener to the clonedDiv itself
    addContextMenuListenerToElement(clonedDiv);

    // Process child elements recursively
    for (const child of clonedDiv.children) {
        processChildElements(child); // A recursive call to iterate to each children
    }

    rightClickWidgetActive = true;
}

 function inputListeners() {
  const textInputs = document.querySelectorAll('.text-input');

  textInputs.forEach(input => {
    input.addEventListener('input', function() {
      // Remove numbers and special characters using a regular expression
      this.value = this.value.replace(/[^a-zA-Z\s-]/g, '');
    });
  });

  const numericInputs = document.querySelectorAll('.numeric-input');

  numericInputs.forEach(input => {
    input.addEventListener('input', function() {
      // Remove numbers and special characters using a regular expression
      this.value = this.value.replace(/[^0-9]/g, '');
    });
  });
 }


function adjustTextareaHeight(element) {
    var parentContainer = element.parentElement;
    var pageContainer = parentContainer.parentElement;
    var pageHeight = 0 + padding;
    var oldElementHeight = parseInt(element.style.height); // 137px
    var newElementHeight = parseInt(element.scrollHeight);
    var addedHeight = newElementHeight - oldElementHeight;

    if (newElementHeight > oldElementHeight) {
         // Iterate through all child elements of currentPageContent
         const childElements = pageContainer.children;
         for (let i = 0; i < childElements.length; i++) {
          const childElement = childElements[i];
          // Calculate the height of the current child element and add it to currentHeight
          pageHeight += calculateDivHeight(childElement) + 10;
         }

         if ((pageHeight + addedHeight) > (maxHeight)) {
             // alert("Page Already Full"); // REQUIRED MODAL HERE
             adaptPageContent();
         }
    }

    element.style.height = 'auto'; // Reset the height to auto
    element.style.height = `${element.scrollHeight}px`; // Set the height to match the scroll height
    adaptPageContent();

    return element;
}



function calculateTotalHeight(elements) {
    var totalHeight = 0;
    elements.forEach(element => {
        totalHeight += calculateDivHeight(element) + 10;
    });
    return totalHeight;
}

function adaptPageContent() {
    console.log("entered: ");
    var allPages = document.querySelectorAll(".drop-container"); // Query all pages
    var currentPageIndex;

    allPages.forEach(function checkEachPage(page, index) {
        console.log("Page: " + index);
        var currentPageChildren = Array.from(page.children);
        var currentPageHeight = calculateTotalHeight(currentPageChildren);
        var nextPage = allPages[index + 1];
        console.log("Current Page Height: " + currentPageHeight);
        setMaxHeight();
        console.log("Max Height: " + maxHeight);

        // Check if the current page exceeds maxHeight and rearrange content accordingly
        while (currentPageHeight > maxHeight) {
            var lastChildOfCurrentPage = currentPageChildren[currentPageChildren.length - 1];

            // Move the last child of the current page to the next page
            if (nextPage == null) {
                console.log("Created a new page!");
                nextPage = createNewPage();
                //allPages = document.querySelectorAll(".drop-container");
                adaptPageContent();
            }
            var firstChildOfNextPage = nextPage.children[0];
            var secondChildOfNextPage = nextPage.children[1];

            if (firstChildOfNextPage && firstChildOfNextPage.children[0].classList.contains('header')) {
                // If the first child of the next page is a header, append to the second child
                nextPage.insertBefore(lastChildOfCurrentPage, secondChildOfNextPage);
            } else {
                // If the first child of the next page is not a header, append as the first child
                nextPage.insertBefore(lastChildOfCurrentPage, firstChildOfNextPage);
            }

            // Recalculate current page height after moving the last child
            currentPageChildren = Array.from(page.children);
            currentPageHeight = calculateTotalHeight(currentPageChildren) + padding;
        }

        while (currentPageHeight < maxHeight && nextPage) {
            var secondChildOfNextPage = nextPage.firstElementChild.nextElementSibling;
            console.log(secondChildOfNextPage);

            if (secondChildOfNextPage) {
                var spaceAvailable = maxHeight - currentPageHeight;
                var secondChildHeight = calculateDivHeight(secondChildOfNextPage);

                if (secondChildHeight <= spaceAvailable) {
                    page.appendChild(secondChildOfNextPage); // Move the child to the current page
                    currentPageHeight += secondChildHeight;
                } else {
                    // Move the second child of the current page to the previous page
                    var firstChildOfCurrentPage = page.firstElementChild;
                    if (firstChildOfCurrentPage && firstChildOfCurrentPage.classList.contains('header')) {
                        var secondChildOfCurrentPage = firstChildOfCurrentPage.nextElementSibling;
                        if (secondChildOfCurrentPage) {
                            //previousPage.appendChild(secondChildOfCurrentPage);
                            currentPageHeight -= calculateDivHeight(secondChildOfCurrentPage);
                        }
                    } else {
                        if (firstChildOfCurrentPage) {
                            //previousPage.appendChild(firstChildOfCurrentPage);
                            currentPageHeight -= calculateDivHeight(firstChildOfCurrentPage);
                        }
                    }
                    break; // Break the loop if the child cannot fit in the current page
                }
            } else {
                break; // Break the loop if there is no second child in the next page
            }
        }


                // Update nextPage for the next iteration
                nextPage = allPages[index + 1];

        });

    updatePageNumbers();
    checkCurrentPage();
    reassignSectionID();
}


// Page Settings
function setMaxHeight() {
    // Get all elements with the class "drop-container"
    var dropContainers = document.querySelectorAll('.drop-container');

    dropContainers.forEach(function (dropContainer) {
        const computedStyle = getComputedStyle(dropContainer);
        // Extract the padding value
        const paddingValue = computedStyle.getPropertyValue('padding');
        padding = parseFloat(paddingValue); // Extract the numeric part of the padding value (removing 'px' or other units)
        maxHeight = dropContainer.offsetHeight - padding;
    });
}

// Initializes a new page when the current page is full.
function createNewPage() {
	currentPage++;
	const newPage = document.createElement('div');
	//newPage.classList.add('drop-container', 'draggable'); // original line
	newPage.classList.add('drop-container'); // Add custom class names
	newPage.setAttribute('id', `page-${currentPage}`); // Give the page a unique ID

	var dropContainers = document.querySelectorAll('.drop-container');

	// Check if the first drop container has a class of 'landscape'
	if (dropContainers.length > 0 && dropContainers[0].classList.contains('landscape')) {
		// The first drop container has the 'landscape' class
		newPage.classList.add('landscape');
	}

	const containerDiv = document.querySelector('.pages');
	containerDiv.appendChild(newPage); // Append the new page to the container div

	// Copy the first 'header' div from the previous page, if it exists
	if (currentPage > 1) {
		const previousPage = document.querySelector(`#page-1`);
		const headerDiv = previousPage.querySelector('.header');
		if (headerDiv) {
		    sectionCount += 1;
            const sectionDiv = document.createElement('div');
            sectionDiv.id = "section-" + currentPage + "-" + sectionCount;
			const headerClone = headerDiv.cloneNode(true);
			sectionDiv.appendChild(headerClone);
			// Remove the click listener
			headerClone.removeEventListener('click', createContextMenu);
			newPage.appendChild(sectionDiv);
            updatePageNumbers();
		}
	}

	addEventListenerToDiv(newPage);

    newPage.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/html', newPage.outerHTML);
        activeDraggable = newPage;
    });

//    newPage.addEventListener('click', (e) => {
//    	selectElement(newPage);
//    });

    currentPageContent.style.pageBreakAfter = 'always'; // Add page break after the current page
    currentPageContent = newPage; // Update pointer of current page
    currentHeight = 0 + header_height + padding; // Reset current height for the new page
    return newPage;
}

// Page Settings
function modifyOrientation() {

    const orientation = document.getElementById("modifyOrientation");
    const selectedValue = orientation.value;

    // Get all elements with the class "drop-container"
    var dropContainers = document.querySelectorAll('.drop-container');

    if (selectedValue === "landscape") {
        // Add the 'landscape' class to all drop containers
        setMaxHeight(); // Update page height. Dynamic calculation of max height
        dropContainers.forEach(function (dropContainer) {
            dropContainer.classList.add("landscape");
                adaptPageContent()
        });
        adaptPageContent();
    } else if (selectedValue === "portrait") {
        // Remove the 'landscape' class from all drop containers
        setMaxHeight();
        dropContainers.forEach(function (dropContainer) {
            dropContainer.classList.remove("landscape");
            adaptPageContent();
        });
        adaptPageContent();
    }

     adaptPageContent()
     checkCurrentPage();
     reassignSectionID();
}

function createPageMargin() {
	const select = document.getElementById("createPageMargin");
	const selectedValue = select.value;

	// Get all elements with the class "drop-container"
	var dropContainers = document.querySelectorAll('.drop-container');

	// Remove any existing margin class from all dropContainers
	dropContainers.forEach(function (dropContainer) {
		dropContainer.classList.remove('margin-whole-inch', 'margin-half-inch', 'margin-moderate');
	});


	if (selectedValue === "normal") {
		// Add the new margin class
		dropContainers.forEach(function (dropContainer) {
			dropContainer.classList.add('margin-whole-inch');
			const computedStyle = getComputedStyle(dropContainer);
			// Extract the padding value
			const paddingValue = computedStyle.getPropertyValue('padding');

			// Extract the numeric part of the padding value (removing 'px' or other units)
			padding = parseFloat(paddingValue);
			maxHeight = dropContainer.offsetHeight - padding;
		});
		adaptPageContent();
        reassignSectionID();
	} else if (selectedValue === "narrow") {
		// Add the new margin class
		dropContainers.forEach(function (dropContainer) {
            dropContainer.classList.add('margin-half-inch');

            const computedStyle = getComputedStyle(dropContainer);
            // Extract the padding value
            const paddingValue = computedStyle.getPropertyValue('padding');

            // Extract the numeric part of the padding value (removing 'px' or other units)
            padding = parseFloat(paddingValue) * 2;
            maxHeight = dropContainer.offsetHeight - padding;
		});
		adaptPageContent();
        reassignSectionID();
	} else if (selectedValue === "moderate") {
	    // Add the new margin class
        dropContainers.forEach(function (dropContainer) {
            dropContainer.classList.add('margin-moderate');
            const computedStyle = getComputedStyle(dropContainer);
            // Extract the padding value
            const paddingValue = computedStyle.getPropertyValue('padding');
            // Extract the numeric part of the padding value (removing 'px' or other units)
            padding = parseFloat(paddingValue);
            maxHeight = dropContainer.offsetHeight - padding;
        });
        adaptPageContent();
        reassignSectionID();
	}
currentHeight = updatePageHeight();
console.log("end");
}

function makeAlignCenter() {
    if (selectedTextBox) {
        selectedTextBox.classList.remove('w3-center', 'w3-justify', 'w3-right-align', 'w3-left-align');
        selectedTextBox.classList.add('w3-center');
    }
}

function makeAlignLeft() {
    if (selectedTextBox) {
        selectedTextBox.classList.remove('w3-center', 'w3-justify', 'w3-right-align', 'w3-left-align');
        selectedTextBox.classList.add('w3-left-align');
    }
}

function makeAlignJustify() {
    if (selectedTextBox) {
        selectedTextBox.classList.remove('w3-center', 'w3-justify', 'w3-right-align', 'w3-left-align');
		selectedTextBox.classList.add('w3-justify');
    }
}

function makeAlignRight() {
    if (selectedTextBox) {
        selectedTextBox.classList.remove('w3-center', 'w3-justify', 'w3-right-align', 'w3-left-align');
		selectedTextBox.classList.add('w3-right-align');
    }
}

function makeInputUneditableOnDeployment() {
	if(selectedTextBox) {
		selectedTextBox.classList.add('w3-uneditable');
	}
}

function makeInputEditableOnDeployment() {
	if(selectedTextBox) {
		selectedTextBox.classList.remove('w3-uneditable');
	}
}

// Table Functions
function mergeCells(table) {
	const selectedCells = getSelectedCells(table);
	if (selectedCells.length < 2) {
		alert('Select at least two cells to merge.'); // REQUIRED MODAL HERE
		return;
	}

	const firstCell = selectedCells[0];
	const mergedContent = selectedCells.map(cell => cell.textContent).join('\n');

	// Determine the number of rows and columns to span
	let rowspan = 1;
	let colspan = 1;

	// Check if selected cells are in the same row
	const sameRow = selectedCells.every(cell => cell.parentElement === firstCell.parentElement);
	const sameColumn = selectedCells.every(cell => cell.cellIndex === firstCell.cellIndex);


	if (sameRow) {
		// If in the same row, set colspan to the number of selected cells
		colspan = selectedCells.length;
	} else if (sameColumn) {
		// If in different rows, set rowspan to the number of selected cells
		rowspan = selectedCells.length;
	} else {
	   // Calculate equivalent colspan and rowspan based on the positions of selected cells
		const firstRowIndex = firstCell.parentElement.rowIndex;
		const lastRowIndex = selectedCells[selectedCells.length - 1].parentElement.rowIndex;
		const firstCellIndex = firstCell.cellIndex;
		const lastCellIndex = selectedCells[selectedCells.length - 1].cellIndex;

		// Calculate colspan and rowspan based on cell positions
		colspan = lastCellIndex - firstCellIndex + 1;
		rowspan = lastRowIndex - firstRowIndex + 1;
	}

	// Set rowspan and colspan for the first cell
	firstCell.textContent = mergedContent;
	firstCell.setAttribute('rowspan', rowspan); // Set rowspan attribute correctly
	firstCell.setAttribute('colspan', colspan);

	// Update the row span of the cell when merged horizontally
	if (!sameRow) {
		const firstRowIndex = firstCell.parentElement.rowIndex;
		const lastRowIndex = firstRowIndex + rowspan - 1;
		for (let i = firstRowIndex + 1; i <= lastRowIndex; i++) {
			const cellToUpdate = table.rows[i].cells[firstCell.cellIndex];
			cellToUpdate.style.display = 'none'; // Hide cell
		}
	}

	// Update the row span of the cell when merged vertically
	if (sameRow && colspan > 1) {
		for (let i = 1; i < colspan; i++) {
			const cellToUpdate = firstCell.parentElement.cells[firstCell.cellIndex + i];
			cellToUpdate.style.display = 'none'; // Hide cell
		}
	}

	// Replace the rest of the selected cells with empty cells
	selectedCells.slice(1).forEach(cell => {
		cell.parentElement.removeChild(cell);
	});

	clearSelection(table);
}

function unmergeCells(table) {
	const selectedCells = getSelectedCells(table);

	if (selectedCells.length === 0) {
		alert('Select a merged cell to unmerge.'); // REQUIRED MODAL HERE
		return;
	}

	// Store the first cell's position and content
	const firstCell = selectedCells[0];
	const rowIndex = firstCell.parentElement.rowIndex;
	const cellIndex = firstCell.cellIndex;

	const rowspan = parseInt(firstCell.getAttribute('rowspan')) || 1;
	const colspan = parseInt(firstCell.getAttribute('colspan')) || 1;

	const originalContent = firstCell.textContent;

	// Iterate through the selected cells
	selectedCells.forEach(cell => {
		// Clear rowspan and colspan attributes
		cell.removeAttribute('rowspan');
		cell.removeAttribute('colspan');

		// Restore content and appearance
		cell.classList.remove('merged');

		var colCount = 0;
		// Iterate to restore original content and appearance for each cell
		for (let i = 0; i < rowspan; i++) {
			const newRow = table.rows[rowIndex + i];

			if (newRow) {

				for (let j = 0; j < colspan; j++) {
					const newCell = document.createElement('td');
					newCell.textContent = originalContent;

				    if (newRow.cells.length == table.rows[0].cells.length) {
					    continue;
				    }
					newRow.insertBefore(newCell, newRow.cells[cellIndex + j]);
				}
			}
		}
	});
	clearSelection(table);
}

function addTableRow(table) {
    var parentContainer = table.parentElement; // Section DIV container extractor
    var pageContainer = parentContainer.parentElement; // Page Locator
    var pageHeight = 0 + padding;

    // Iterate through all child elements of currentPageContent
    const childElements = pageContainer.children;
    for (let i = 0; i < childElements.length; i++) {
    	const childElement = childElements[i];
    	// Calculate the height of the current child element and add it to currentHeight
    	pageHeight += calculateDivHeight(childElement) + 10;
    }

    if ((pageHeight + 40) > (maxHeight)) {
        alert("Cannot add any more row."); // REQUIRED MODAL HERE
        // Append new table rows to next page here
        adaptPageContent();
//        return;
    }

	const newRow = table.insertRow(table.rows.length);

	let sumColSpan = -1;
	let hasColspan = false;

	// Get the first row of the table
	const firstRow = table.rows[0];

	// Iterate through the cells in the first row
	for (let j = 0; j < firstRow.cells.length; j++) {
        const cell = firstRow.cells[j];

        // Check if the cell has a colspan attribute greater than 1
        if (cell.colSpan > 1) {
            sumColSpan += cell.colSpan;
	    }
	}

	if (sumColSpan == -1) {
		sumColSpan = 0;
	}

	let rowColCount = sumColSpan + table.rows[0].cells.length;

    var onceOnly = true;
	for (let i = 0; i < rowColCount; i++) {
		const cell = newRow.insertCell(i);
		cell.contentEditable = true;
		if (onceOnly) {
			onceOnly = false;
		    cell.textContent = 'Text';
		} else {
			cell.textContent = '';
		}
	}
    currentHeight += 40;
    adaptPageContent();
}

// Append a column at the right
function addTableColumn(table) {
	const numRows = table.rows.length;

	for (let i = 0; i < numRows; i++) {
		const newRow = table.rows[i];
		const cell = newRow.insertCell(newRow.cells.length);
		cell.contentEditable = true;
		cell.textContent = '';
	}
}

function removeTableRow(table, rowIndex) {
	if (table.rows.length > 1) {
		table.deleteRow(rowIndex);
		adaptPageContent();
	} else {
		alert("Cannot remove the last row. You can delete the widget instead"); // REQUIRED MODAL HERE
	}
}

function removeTableColumn(table, columnIndex) {
	const numRows = table.rows.length;

	if (numRows > 0) {
		for (let i = 0; i < numRows; i++) {
			const row = table.rows[i];
			if (row.cells.length > 1) {
				row.deleteCell(columnIndex);
				adaptPageContent();
			} else {
				alert("Cannot remove the last cell in a row."); // REQUIRED MODAL HERE
			}
		}
	}
}

// Context Menus
function createContextMenu(x,y,element, table) {
    var isChild = false;

    if (rightClickWidgetActive) { // Right click is active, remove the added buttons to avoid duplication
        while (contextMenu.firstChild) {
            contextMenu.removeChild(contextMenu.firstChild);
        }
        rightClickWidgetActive = false;
    } else {
        contextMenu.classList.add('context-menu');

        // Control which buttons will be shown on context menu base on user type
        if (userType === "Secretary" || userType === "Department Head" || userType === "Dean") {
            // Secretary can only view the form
            return; // Do not enable right click functions
        } else if (userType === "Dean") {
            // Upload signature
        } else if (userType === "Super Admin" || userType === "Document Controller")  {
            // All functions
            if (table) {
                console.log("is a table 2");
                contextMenuButtonsForTable(table);
            }

            contextMenuButtonsForContainer(element);

            const deleteButton = document.createElement('button');
            deleteButton.classList.add("button-box");
            deleteButton.innerText = 'Delete Widget';
            deleteButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this box?')) {
                    if (selectedTextBox.parentElement != null) {

                        if (selectedTextBox.nodeName === "TD" || selectedTextBox.nodeName === "TR") {
                            var parentNode = selectedTextBox.parentNode;
                            var tableContainer = parentNode.parentNode;

                            if (tableContainer.nodeName === "TBODY") {
                                var tableContainerOuter = tableContainer.parentElement;
                                tableContainerOuter.remove();
                                checkCurrentPage();
                                repositionBoxes();
                                reassignSectionID();
                            } else {
                                tableContainer.remove();
                                checkCurrentPage();
                                repositionBoxes();
                                adaptPageContent();
                                reassignSectionID();
                            }
                            sectionCount -= 1;
                            currentHeight = updatePageHeight();
                        return;
                        } else {
                            if (element) {
                                const parentContainer = element.parentElement;
                                if (parentContainer.classList.contains("draggable")) {
                                    parentContainer.parentElement.remove();
                                } else {
                                   parentContainer.remove(); // Remove the parent container
                                   checkCurrentPage();
                                   repositionBoxes();
                                   adaptPageContent();
                                   reassignSectionID();
                                }
                            sectionCount -= 1;
                            currentHeight = updatePageHeight();
                            }
                        }
                    }
                }

            });

             contextMenu.appendChild(deleteButton);

             const lockEditOnDeploy = document.createElement('button');
             lockEditOnDeploy.classList.add("button-box");
             lockEditOnDeploy.innerText = "Lock field";

             lockEditOnDeploy.addEventListener('click', () => {
                 if(confirm('Are you sure you want to lock this editable field on deployment?')) {
                     makeInputUneditableOnDeployment();
                 }
                 contextMenu.remove();
             })

             const unlockEditOnDeploy = document.createElement('button');
             unlockEditOnDeploy.classList.add("button-box");
             unlockEditOnDeploy.innerText = "Unlock field";

             unlockEditOnDeploy.addEventListener('click', () => {
                 if(confirm('Are you sure you want to unlock this editable field on deployment?')) {
                     makeInputEditableOnDeployment();
                 }
                 contextMenu.remove();
             })

            contextMenu.appendChild(lockEditOnDeploy);
            contextMenu.appendChild(unlockEditOnDeploy);

        } else if (userType === "Faculty") {
            if (table) {
                contextMenuButtonsForTable(table);
            }
        }

        contextMenu.style.position = 'fixed';
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
        document.body.appendChild(contextMenu);

        rightClickWidgetActive = true;

        document.addEventListener('click', () => {
        	contextMenu.remove();
        });

        // Prevent the default context menu from appearing
        document.addEventListener('contextmenu', (e) => {
        	e.preventDefault();
        });
    }
}

function contextMenuButtonsForContainer(element) {
    var appendSectionColumn;
    var addCheckBoxItem;
    var removeSectionColumn;

    // Add right click functions for grid container
    if (element && element.classList.contains('grid-container') && !element.classList.contains('checkbox')) {

        // Add Section column
        appendSectionColumn = document.createElement('button');
        appendSectionColumn.classList.add("button-section");
        appendSectionColumn.innerText = 'Add Section Column';
        appendSectionColumn.addEventListener('click', () => {
            if(confirm('Add another section?')) {
                element = appendGridItem(element);
            }
            contextMenu.remove();
        })
        contextMenu.appendChild(appendSectionColumn);

        // Remove Section column
        removeSectionColumn = document.createElement('button');
        removeSectionColumn.classList.add("button-section");
        removeSectionColumn.innerText = 'Remove Section Column';
        removeSectionColumn.addEventListener('click', () => {
            if(confirm('Remove column section?')) {
                removeLastGridItem(element);
            }
            contextMenu.remove();
        })
         contextMenu.appendChild(removeSectionColumn);

    } if (element && element.classList.contains('grid-container') && element.classList.contains('checkbox')) {
        addCheckBoxItem = document.createElement('button');
        addCheckBoxItem.classList.add("button-checkbox");
        addCheckBoxItem.innerText = "Add Checkbox Item";
        addCheckBoxItem.addEventListener('click', () => {
            if(confirm('Add another checkbox item?')) {
                appendCheckBoxItem(element);
            }
            contextMenu.remove();
        })
        contextMenu.appendChild(addCheckBoxItem);
        removeSectionColumn = document.createElement('button');
        removeSectionColumn.classList.add("button-checkbox");
        removeSectionColumn.innerText = 'Remove Checkbox Item';
        removeSectionColumn.addEventListener('click', () => {
            if(confirm('Remove checkbox item?')) {
                removeLastGridItem(element);
            }
            contextMenu.remove();
         })
        contextMenu.appendChild(removeSectionColumn);
    }
}

function appendGridItem(element) {
    console.log(element);
    console.log(element.children);
    // Get the last child element
    const lastChild = element.lastElementChild;

    // Clone the last child element
    const clonedLastChild = lastChild.cloneNode(true);

    // Append the cloned element as the last child
    element.appendChild(clonedLastChild);
}

function contextMenuButtonsForTable(table) {
    // Do not add these buttons if user type is not one of the two
    if (userType === "Document Controller" || userType === "Super Admin") {

        const addColumnButton = document.createElement('button');
        addColumnButton.classList.add("button-table");
        addColumnButton.innerText = 'Add Column';

        addColumnButton.addEventListener('click', () => {
            addTableColumn(table);
            contextMenu.remove();
        });

       const removeColumnButton = document.createElement('button');
        removeColumnButton.classList.add("button-table");
        removeColumnButton.innerText = 'Remove Column';

        removeColumnButton.addEventListener('click', () => {
            const colCount = table.rows[0].cells.length;
            removeTableColumn(table, colCount-1);
            contextMenu.remove();
        });


        const mergeCellsButton = document.createElement('button');
        mergeCellsButton.classList.add("button-table");
        mergeCellsButton.innerText = 'Merge Cells';

        mergeCellsButton.addEventListener('click', () => {
            mergeCells(table);
            contextMenu.remove();
        });

        const unmergeCellButton = document.createElement('button');
        unmergeCellButton.classList.add("button-table");
        unmergeCellButton.innerText = 'Unmerge Cell';

        unmergeCellButton.addEventListener('click', () => {
            unmergeCells(table);
            contextMenu.remove();
        });

        contextMenu.appendChild(removeColumnButton);
        contextMenu.appendChild(mergeCellsButton);
        contextMenu.appendChild(unmergeCellButton);
        contextMenu.appendChild(addColumnButton);
    }

    // Add Row
    const addRowButton = document.createElement('button');
    addRowButton.classList.add("button-table");
    addRowButton.innerText = 'Add Row';

    addRowButton.addEventListener('click', () => {
     addTableRow(table);
     adaptPageContent();
     contextMenu.remove();
    });

    // Remove Row
    const removeRowButton = document.createElement('button');
    removeRowButton.classList.add("button-table");
    removeRowButton.innerText = 'Remove Row';

    removeRowButton.addEventListener('click', () => {
        var rowCount = table.rows.length;
        removeTableRow(table, rowCount-1);
        contextMenu.remove();
    });

    contextMenu.appendChild(addRowButton);
    contextMenu.appendChild(removeRowButton);

    return contextMenu;
}

function dropContent(boxHeight, data) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = data;
    tempDiv.classList.add('hover'); // Hover
    const newDiv = tempDiv.querySelector('.draggable');
    setMaxHeight();

    if (newDiv) {
        var clonedDiv = newDiv.cloneNode(true); // clone dragged element
        clonedDiv.removeAttribute("draggable"); // make it not draggable
//        clonedDiv.removeEventListener("dragstart", handleDragStart);
        initializeContextMenuForChild(clonedDiv); // initialize right click functions
        clonedDiv = selectElement(clonedDiv); // add selection listener for sub-children elements
        console.log("added selected");
        clonedDiv = removeReadOnlyAttributesRecursive(clonedDiv); // allow elements to be editable

        if (currentPageContent) { // Check if currentPageContent is defined
            sectionCount += 1; // update section count
            const sectionDiv = document.createElement('div');
            sectionDiv.classList.add("w3-padding-8");
            sectionDiv.id = "section-" + currentPage + "-" + sectionCount;
            sectionDiv.appendChild(clonedDiv); // enclose dropped element to section div

            if ((currentHeight + boxHeight) > (maxHeight)) {
                createNewPage(); // Current page is full, initialize a new page
            }

            clonedDiv.addEventListener('keydown', () => {
                clonedDiv = adjustTextareaHeight(clonedDiv);
            });


            currentPageContent.appendChild(sectionDiv); // Append to the current page's content
            currentHeight = updatePageHeight(); // Update current height
        }

        // Update page numbers
        if (currentPageContent.querySelector("header-table")) {
            updatePageNumbers();
        }
        inputListeners();
    } else {
        console.error('currentPageContent is undefined.'); // Log an error if currentPageContent is undefined
    }
}

// Calculations
function calculateDivHeight(element) {
    if (element.nodeName === "TABLE" || element.nodeName === "TH" || element.nodeName === "TD" ) {
        return element.getBoundingClientRect().height + 10;
    } else {
        return element.getBoundingClientRect().height + 10;
    }
//    return element.scrollHeight;
//    return element.offsetHeight;
}

function updatePageHeight() {
	var tempHeight = 0;
	// Iterate through all child elements of widgetCanvas
	const childElements = currentPageContent.children;
	for (let i = 0; i < childElements.length; i++) {
		const childElement = childElements[i];
		// Calculate the height of the current child element and add it to currentHeight
		tempHeight += calculateDivHeight(childElement);
	}
	return tempHeight;
}

// Miscellaneous
function clearSelection(table) {
  if (table === null) {
    const allTables = document.querySelectorAll('div table');
    allTables.forEach((table) => {
      const selected = table.querySelectorAll('.selectedCells');
      selected.forEach((cell) => cell.classList.remove('selectedCells'));
    });
  } else {
    const selected = table.querySelectorAll('.selectedCells');
    selected.forEach((cell) => cell.classList.remove('selectedCells'));
  }
}


function getSelectedCells(table) {
	const selectedCells = [];
	const cells = table.querySelectorAll('.selectedCells');

	cells.forEach(cell => {
		selectedCells.push(cell);
	});

	return selectedCells;
}

function reassignSectionID() {
    // Get all pages
    const pages = document.querySelectorAll('.drop-container');

    // Loop through each page
    pages.forEach((page, pageIndex) => {
        // Get sections within the current page
        const sections = page.querySelectorAll('div[id^="section-"]');

        // Reset sectionIndex for each page
        let sectionIndex = 0;

        // Update the IDs of the sections within the current page
        sections.forEach((section) => {
            // Increment sectionIndex for each section within the page
            sectionIndex++;

            // Update the ID of the section
            section.id = `section-${pageIndex + 1}-${sectionIndex}`;

            // If the section has no content, delete it and update the section counters on each page
            if (!section.textContent.trim()) {
              section.remove();
              reassignSectionID(); // Recursively call to update section counters after deletion
            }
        });
    });
}

function checkCurrentPage() {
    var numberOfChildren = currentPageContent.childElementCount;
    console.log(currentPageContent);
    // Do nothing if current page is the first page
    if (currentPageContent.id != "page-1") {
        if (numberOfChildren <= 1) {
			var prevpage = currentPage - 1;
			var pageIDString = "page-" + prevpage;
			let dropContainers = document.querySelectorAll('.drop-container');
			let found = false;

			dropContainers.forEach(dropContainer => {
				if (dropContainer.id == pageIDString) {
				    // Get the parent element of currentPageContent
				    const currentPageParent = currentPageContent.parentElement;
				    // Remove currentPageContent from its parent
				    currentPageParent.removeChild(currentPageContent);
				    // Set dropContainer as the new currentPageContent
				    currentPageContent = dropContainer;
				    currentHeight = updatePageHeight();
				    return;
				}
			});
		currentPage -=1;
		}
   }
   currentHeight = updatePageHeight;
}

// Update page count on header with form details table
function updatePageNumbers() {
	// Select all drop-container elements
	const containers = document.querySelectorAll('.drop-container');
	var totalPages = containers.length; // number of pages
	var index = 1;
	containers.forEach(container => {
		// Inside drop-container, find the div with the class 'header'
		const headerContainer = container.querySelector('.header');

        try {
            const headerTable = headerContainer.querySelector('.header-table');

            const pageNumberElement = headerTable.querySelector('.page-number');
            pageNumberElement.textContent = (index) + ' of ' + totalPages;
            index += 1;
        } catch (error) {
            // Handle any errors that might occur within the try block
            return;
        }
	});
}

// Update page sections positioning
function repositionBoxes() {
	const boxes = Array.from(currentPageContent.querySelectorAll('.draggable'));

	boxes.forEach((box) => {

		box.addEventListener('drop', (e) => {
			e.preventDefault();
			const boxes = Array.from(currentPageContent.querySelectorAll('.draggable'));

			if (activeDraggable) {
				const draggedIndex = boxes.indexOf(activeDraggable);
				const currentIndex = boxes.indexOf(box);
				if (draggedIndex !== currentIndex) {
					const referenceIndex = draggedIndex < currentIndex ? currentIndex + 1 : currentIndex;
					currentPageContent.insertBefore(activeDraggable, boxes[referenceIndex]);
					repositionBoxes();
				}
			}
		});
	});
	reassignSectionID();
}

// Initialize dragging listeners for the current page
function addEventListenerToDiv(dropBox) {
	dropBox.addEventListener('dragover', (e) => {
		e.preventDefault();
		dropBox.classList.add('hover');
	});

	dropBox.addEventListener('dragleave', () => {
		dropBox.classList.remove('hover');
	});

    // Handle the drop event
    dropBox.addEventListener('drop', (e) => {
        e.preventDefault();
        setMaxHeight();
        dropBox.classList.remove('hover');
        if (activeDraggable) {
            const boxHeight = calculateDivHeight(activeDraggable);
            if (isFirstElement == true) {
                header_height = boxHeight;
                isFirstElement = false;
            }

            const data = e.dataTransfer.getData('text/html');
            dropContent(boxHeight, data);
            activeDraggable = null;
        }
    });
}

// Make fields editable except those who are set to be uneditable
function removeReadOnlyAttributesRecursive(element) {
    if (!element.classList.contains("w3-uneditable")) {
        if (element instanceof HTMLElement) {
            // Check if the element has a readonly attribute
            if (element.hasAttribute('readonly')) {
              element.removeAttribute('readonly');
            }

            if (element.hasAttribute('disabled')) {
              element.removeAttribute('disabled');
            }

            if (!(element.nodeName === "INPUT" || element.nodeName === "FORM" )) {
                // Set contentEditable attribute to true
                element.setAttribute('contentEditable', 'true');
            }


            // Iterate through child elements
            const childElements = element.children;
            for (let i = 0; i < childElements.length; i++) {

                removeReadOnlyAttributesRecursive(childElements[i]);
            }
        }
    }
    return element;
}

function makeAllReadOnlyRecursive() {
    console.log("hehe");
    // Query all div elements with class "page-container"
    const pageContainers = document.querySelectorAll('.drop-container');

    // Iterate through each page container
    pageContainers.forEach(pageContainer => {
        // Get all children of the current page container
        const childElements = pageContainer.querySelectorAll('*');

        // Iterate through each child element

        if (userType == "Secretary" || userType === "Department Head" || userType === "Dean")  {
            childElements.forEach(child => {
                 console.log(child);
                 if (!(child.classList.contains("signature-image") || child.classList.contains("signature=image-button"))) {
                 // Set the readonly attribute to the element
                  child.setAttribute('readonly', true);

                  child.disabled = true;

                  // Set contentEditable attribute to false
                  child.setAttribute('contentEditable', 'false');
                 }

            });
            return;
        }

        childElements.forEach(child => {
            if (
                !(child instanceof HTMLTextAreaElement
                || child.nodeName == "INPUT"
                || child.nodeName == "TABLE"
                || child.nodeName == "TR"
                || child.nodeName == "DIV"
                || child.nodeName == "TD")
                && !child.hasAttribute('readonly'
                && child.classList.contains("w3-uneditable"))
                && (userType == "Faculty" || userType == "Department Head")) {
                // Set the readonly attribute to the element
                child.setAttribute('readonly', 'true');

                // Set contentEditable attribute to false
                child.setAttribute('contentEditable', 'false');
            } else {
                child = selectElement(child);
            }
        });
    });
}


// Click listeners for selected elements
function selectElement(element) {
    element.addEventListener('click', function (event) {
	    const clickedElement = event.target;

        try {
            // Do not allow selection and edit capability for the header table
            if (findParentTable(clickedElement).classList.contains("header")) {
                return;
            }
        } catch {
            // Handle Error
            // Clicked Element is not a table header
        }

        // Unselect the previously selected text box, if any
        if (selectedTextBox && selectedTextBox.getAttribute('id') === "selectedElement") {
            // Assuming selectedTextBox is a label containing an input element
            if (selectedTextBox.tagName.toLowerCase() === 'label') {
                const inputInsideLabel = selectedTextBox.querySelector('input');
                if (inputInsideLabel) {
                    const labelFor = selectedTextBox.getAttribute('for');
                    if (labelFor) {
                        inputInsideLabel.setAttribute('id', labelFor);
                    }
                }
            } else {
                // Check if the "id" attribute matches the selectedElement
                selectedTextBox.removeAttribute('id');
            }
        } else if (selectedTextBox && element.classList.contains("drop-container")) {
           selectedTextBox.removeAttribute('contentEditable');
           var pageID = 'page-' + currentPage;
           selectedTextBox.setAttribute('id', pageID);
        } else if (selectedTextBox) {
            selectedTextBox.removeAttribute('contentEditable');
        }

        clickedElement.removeAttribute('readonly');

        if (clickedElement.classList.contains("w3-uneditable")) {
            clickedElement.setAttribute('contentEditable', 'false');
            clickedElement.setAttribute('readOnly', 'true');
            return; // do not make it selectable
        } else {
            // Ensure the clicked element is editable
            clickedElement.removeAttribute('readonly');
        }

        if ((clickedElement.tagName === 'TD' || clickedElement.tagName === 'TH') && !clickedElement.classList.contains('merged')) {
            const index = selectedCells.indexOf(clickedElement);

            if (index === -1) {
                const lastSelectedCell = selectedCells[selectedCells.length - 1];
                if (lastSelectedCell && lastSelectedCell.parentNode) {
                    const selectedRowIndex = lastSelectedCell.parentNode.rowIndex;
                    const selectedCellIndex = lastSelectedCell.cellIndex;
                    const clickedRowIndex = clickedElement.parentNode.rowIndex;
                    const clickedCellIndex = clickedElement.cellIndex;

                    const isAdjacent = (
                        (selectedRowIndex === clickedRowIndex && Math.abs(selectedCellIndex - clickedCellIndex) === 1) ||
                        (selectedCellIndex === clickedCellIndex && Math.abs(selectedRowIndex - clickedRowIndex) === 1)
                    );

                    if (isAdjacent) {
                        // Add the clicked cell to the selection if adjacent
                        clickedElement.classList.add('selectedCells');
                        selectedCells.push(clickedElement);
                    } else {
                        // Clear the previous selection and start a new selection
                        selectedCells.forEach(cell => {
                            cell.classList.remove('selectedCells');
                        });
                        selectedCells = [clickedElement];
                    }
                } else {
                    // If no cells are selected, add the clicked cell to the selection
                    clickedElement.classList.add('selectedCells');
                    selectedCells.push(clickedElement);
                }
            } else {
                // If already selected, deselect the cell
                clickedElement.classList.remove('selectedCells');
                selectedCells.splice(index, 1);
            }
        } else {

            if (clickedElement.querySelector('input[type="checkbox"]') && clickedElement.querySelector('input[type="radio"]')) {
                clickedElement.removeAttribute('contentEditable');
            } else {
                // If other types of elements are clicked, handle accordingly
               // For example, set an ID to identify the selected element
               clickedElement.id = 'selectedElement';
            }

            selectedCells = []; // Clear selected cells if non-table elements are clicked
        }
        selectedTextBox = clickedElement; // Update pointer to selected element based on current click
    });

    return element;
}


function findParentTable(element) {
  try {
    while (element && element.tagName !== 'TABLE') {
      element = element.parentElement;
    }
  } catch {
    // Do something
  }

  return element; // Returns the parent table element or null if not found
}

function makeUnderline() {
	if (selectedTextBox) {
         if (!selectedTextBox.classList.contains("w3-underline")) {
            selectedTextBox.classList.add('w3-underline');
         } else {
             // Append the textContent in the current span
             selectedTextBox.classList.remove('w3-underline');
         }
    }
}

function makeItalic() {
	if (selectedTextBox) {
         if (!selectedTextBox.classList.contains("w3-italic")) {
            selectedTextBox.classList.add('w3-italic');
         } else {
             // Append the textContent in the current span
             selectedTextBox.classList.remove('w3-italic');
         }
    }
}

function makeBold() {
	if (selectedTextBox) {
         if (!selectedTextBox.classList.contains("w3-bold")) {
            selectedTextBox.classList.add('w3-bold');
         } else {
             // Append the textContent in the current span
             selectedTextBox.classList.remove('w3-bold');
         }
    }
}

function changeTextColor() {
    if (selectedTextBox) {
        const colorSelect = document.getElementById("colorSelect");
        const selectedColor = colorSelect.value;
        var color = "w3-text-" + selectedColor;

        const currentColorClass = Array.from(selectedTextBox.classList).find(cls => cls.startsWith("w3-text-"));
        if (currentColorClass) {
            // Remove the current color class
            selectedTextBox.classList.remove(currentColorClass);
        }
        // Add the new color class
        selectedTextBox.classList.add("w3-text-" + selectedColor);
    }
}
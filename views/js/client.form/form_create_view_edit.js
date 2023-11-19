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

// On load of page, initialize global variables
window.onload = function() {
    contextMenu = document.createElement('div');
    containerDiv = document.getElementById('outer-container');
    dropBox = document.querySelector('.drop-container');
    dropContainers = document.querySelectorAll('.drop-container');
    currentPageContent = document.querySelector('.drop-container');
    currentPage = dropContainers.length;
    tables = document.querySelectorAll('.table');
    activeDraggable = null;
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

    initializeDraggables();
    if (currentPageContent.childElementCount > 0) {
        initializeCurrentPage();
    } else {
        //console.log("currentPageContent is empty or falsy:", currentPageContent);
    }

    currentPageContent.addEventListener('click', (e) => { // Can select the page canvas
    	selectElement(currentPageContent);
    });


    addEventListenerToDiv(currentPageContent);
};

function initializeDraggables() {
    var tables = document.querySelectorAll('.table');
    var boxes = document.querySelectorAll('.box');
    var draggables = document.querySelectorAll('.draggable');

    // Element Initialization
    // Allow selected draggable widget to be dragged. Upon dropping in the canvas, allow its HTML structure to be cloned
    tables.forEach((table) => {
    	table.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/html', table.outerHTML);
            activeDraggable = table;

        });
    });

    draggables.forEach((draggable) => {
    	draggable.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/html', draggable.outerHTML);
            activeDraggable = draggable;

        });
    });

    boxes.forEach((box) => {
    	box.addEventListener('dragstart', (e) => {
    		e.dataTransfer.setData('text/html', box.outerHTML);
    		activeDraggable = box;
    	});
    });

    currentPageContent.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/html', currentPageContent.outerHTML);
            activeDraggable = currentPageContent;
        });

    currentPageContent.addEventListener('click', (e) => { // Page Canvas can be clicked
    	selectElement(currentPageContent);
    });
}

// Tnitialize current page upon load
function initializeCurrentPage(){
    var pagesParent = document.getElementById("form-content");
    var pagesChildren = pagesParent.children;
    var countOfPages = 0;

    for (var i = 0; i < pagesChildren.length; i++) {
        countOfPages = countOfPages + 1;
    }

    currentPage = countOfPages; // Sum how many drop-containers pages there is and set the last page as the current page

    initializeHeightOfCurrentPage(currentPage); // Calculate height of the last page
    initializeContextMenuForChildren(currentPage); // Enable right click functions for content
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

        for(j = 0; j < children.length; j++){
            initializeContextMenuForChild(children[j].firstElementChild);
        }
    }
}

// A branch of initializeContextMenuForChildren() function that calls the contextMenu
// listener respectively for each child section div
function initializeContextMenuForChild(clonedDiv) {
    function addContextMenuListenerToElement(clonedDiv) {
        clonedDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (clonedDiv.classList.contains("form-table")) {
                activateElement(clonedDiv, "table");
                createContextMenu(e.clientX, e.clientY, null, clonedDiv);
            } else {
                activateElement(clonedDiv, "div");
                createContextMenu(e.clientX, e.clientY, clonedDiv, null);
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

         console.log("Table Parent Page Height: " + pageHeight);
         if ((pageHeight + addedHeight) > (maxHeight+padding)) {
             // alert("Page Already Full"); // REQUIRED MODAL HERE
             adaptSucceedingContent(parentContainer);
         }
        console.log("New is greater than old");
    }

    element.style.height = 'auto'; // Reset the height to auto
    element.style.height = `${element.scrollHeight}px`; // Set the height to match the scroll height
    dynamicFillEmptySpace(parentContainer);
}

function dynamicFillEmptySpace(startingPoint) {
    var allPages = document.querySelectorAll(".drop-container"); // Query all pages
    var sectionID; // Step 1
    var pageID; // Step 2

    if (startingPoint == null) {
        sectionID = "section 1-1";
        pageID = "page-1";
    } else {
        sectionID = startingPoint.id;
        pageID = startingPoint.parentElement.id;
    }

    var currentPageIndex = Array.from(allPages).findIndex(page => page.id === pageID);

    if (currentPageIndex == null) {
        currentPageIndex = 1;
    }

    // Step 3: Calculate total height of children in each page
    for (var i = currentPageIndex; i < allPages.length; i++) {
        var currentPage = allPages[i];
        var currentPageChildren = Array.from(currentPage.children);

        var currentPageHeight = calculateTotalHeight(currentPageChildren) + padding;

        // Step 4: If there is still space in a given page
        if (currentPageHeight < maxHeight) {
            var nextPageIndex = i + 1;
            if (nextPageIndex < allPages.length) {
                var nextPage = allPages[nextPageIndex];
                var secondChildOfNextPage = nextPage.children[1]; // Assuming the second child needs to be moved

                if (secondChildOfNextPage) {
                    var spaceAvailable = maxHeight - currentPageHeight;
                    var secondChildHeight = calculateDivHeight(secondChildOfNextPage);

                    // Step 5: If there's enough space, move the child
                    if (secondChildHeight <= spaceAvailable) {
                        currentPage.appendChild(secondChildOfNextPage); // Move the child to the current page
                        currentPageHeight += secondChildHeight;
                    }

                    // Step 6: Adjust the children of the next page
                    // Assuming the moved child needs to be replaced with the first child of the next page
                    //var firstChildOfNextPage = nextPage.children[0];
                    //nextPage.insertBefore(firstChildOfNextPage, secondChildOfNextPage.nextSibling);
                }
            }
        }
    }

    updatePageNumbers();
    checkCurrentPage();
}

function calculateTotalHeight(elements) {
    var totalHeight = 0;
    elements.forEach(element => {
        totalHeight += calculateDivHeight(element);
    });
    return totalHeight;
}

function adaptSucceedingContent(startingPoint, maxHeight) {
        var allPages = document.querySelectorAll(".drop-container"); // Query all pages

        var sectionID = startingPoint.id; // Step 1
        var pageID = startingPoint.parentElement.id; // Step 2

        // Step 3: Calculate the page height where the starting point element is located
        var currentPageIndex = Array.from(allPages).findIndex(page => page.id === pageID);
        var initialPageHeight = 0;
        for (var i = 0; i <= currentPageIndex; i++) {
            var currentPage = allPages[i];
            initialPageHeight += currentPage.offsetHeight;
        }

        var startingPointSectionID = parseInt(sectionID.match(/(\d+)$/)[1]); // section count of starting element
        var startingPointPageSuccChildren = []; // Succeeding children after element pointer
        var nextPageIndex = currentPageIndex + 1;

        var startingPointPageChildrenCount = startingPoint.parentElement.children; // Section count page of element pointer

        for (var i = 0; i < startingPointPageChildrenCount.length; i++) {
            if (parseInt(startingPointPageChildrenCount[i].id.match(/(\d+)$/)[1]) > startingPointSectionID) {
                var currentDivHeight = calculateDivHeight(startingPointPageChildrenCount[i]);

                if ((initialPageHeight + currentDivHeight) <= maxHeight) {
                    initialPageHeight += currentDivHeight; // Step 4
                } else {
                    console.log("Move " + startingPointPageChildrenCount[i].id + " to next page"); // Step 5
                    var nextPage = allPages[nextPageIndex];

                    if (!nextPage) {
                        nextPage = createNewPage(); // Create a new page if nextPage is null
                        allPages = document.querySelectorAll(".drop-container"); // Update the list of pages
                    }

                    // Append as the second child in the next page
                    if (nextPage.children.length >= 2) {
                        nextPage.insertBefore(startingPointPageChildrenCount[i], nextPage.children[1]);
                    } else {
                        nextPage.appendChild(startingPointPageChildrenCount[i]);
                    }

                    startingPointPageSuccChildren.push(startingPointPageChildrenCount[i]); // Step 3 for the next page
                    nextPageIndex++;
                    initialPageHeight = currentDivHeight; // Reset initial page height for the next page
                }
            } else {
                initialPageHeight += calculateDivHeight(startingPointPageChildrenCount[i]); // Step 4
            }
        }
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

    newPage.addEventListener('click', (e) => {
    	selectElement(newPage);
    });

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
        dropContainers.forEach(function (dropContainer) {
            dropContainer.classList.add("landscape");
            setMaxHeight(); // Update page height. Dynamic calculation of max height
        });
    } else if (selectedValue === "portrait") {
        // Remove the 'landscape' class from all drop containers
        dropContainers.forEach(function (dropContainer) {
        dropContainer.classList.remove("landscape");
        setMaxHeight(); // Update page height. Dynamic calculation of max height
        });
    }
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

    if ((pageHeight + 40) > (maxHeight+padding)) {
        alert("Cannot add any more row."); // REQUIRED MODAL HERE
        // Append new table rows to next page here
        adaptSucceedingContent(parentContainer);
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
    dynamicFillEmptySpace(null);
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
		dynamicFillEmptySpace(null);
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
				dynamicFillEmptySpace(null);
			} else {
				alert("Cannot remove the last cell in a row."); // REQUIRED MODAL HERE
			}
		}
	}
}

// Export Functions
function getPDF(id) {

	var top_left_margin = 15;
	var PDF_Width = 210; // A4 width in mm
	var PDF_Height = 297; // A4 height in mm

	var pdf = new jsPDF({
		orientation: 'portrait',
		unit: 'mm',
		format: [PDF_Width, PDF_Height],
		autoPaging: true // Enable text selection
	});

	// Select all elements with the class .canvas_div_pdf
	let content_id = "." + id;
	var contentElements = document.querySelectorAll(content_id);

	// Define a function to generate PDF for a single content element
	function generatePDFForElement(index) {
		var content = contentElements[index];
		var HTML_Width = content.offsetWidth;
		var HTML_Height = content.offsetHeight;
		var canvas_image_width = HTML_Width;
		var canvas_image_height = HTML_Height;



		html2canvas(content, { allowTaint: true, scale: 1 }).then(function (canvas) {
			canvas.getContext('2d');

			 content.style.backgroundColor = 'white'; // Change 'white' to the desired background color


			var imgData = canvas.toDataURL("image/jpeg", 1.0);

			if (index > 0) {
				pdf.addPage([PDF_Width, PDF_Height]);
			}

			pdf.addImage(imgData, 'JPEG', top_left_margin, top_left_margin, PDF_Width, PDF_Height);

			if (index < contentElements.length - 1) {
				generatePDFForElement(index + 1); // Recursively generate PDF for the next content element
			} else {
				pdf.save("HTML-Document.pdf"); // Save the final PDF when all elements have been processed
			}
		});
	}

	if (contentElements.length > 0) {
		generatePDFForElement(0); // Start generating PDF for the first content element
	}
}

function downloadPDF(divToPrint) {
    // Configuration options for html2pdf
	const options = {
        margin: 10,
        filename: 'document.pdf', // Change the filename as needed
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
	};

	// Use html2pdf to convert the div to a PDF
	html2pdf().from(divToPrint).set(options).outputPdf(function (pdf) {
        // Trigger the download of the PDF
        const blob = new Blob([pdf], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = options.filename;
        link.click();
	});
}

// Context Menus
function createContextMenu(x,y,element, table) {
    var isChild = false;
    var parentContainer = selectedTextBox.parentElement;

    if (rightClickWidgetActive) { // Right click is active, remove the added buttons to avoid duplication
        while (contextMenu.firstChild) {
            contextMenu.removeChild(contextMenu.firstChild);
        }
        rightClickWidgetActive = false;

    } else {
        contextMenu.classList.add('context-menu');

        // Control which buttons will be shown on context menu base on user type
        if (userType === "Secretary") {
            // Secretary can only view the form
            return; // Do not enable right click functions
        } else if (userType === "Dean") {
            // Upload signature
        } else if (userType === "Super Admin" || userType === "Document Controller")  {
            // All functions
            if (table) {
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
                                reassignSectionID();
                                var tableContainerSectionCover = tableContainerOuter;
                            } else {
                                tableContainer.remove();
                                reassignSectionID();
                                checkCurrentPage();
                            }
                        } else {
                            if (element) {
                                const parentContainer = element.parentElement;
                                parentContainer.remove(); // Remove the parent container
                                reassignSectionID();
                            }
                            checkCurrentPage();
                        }
                        dynamicFillEmptySpace(null);
                        sectionCount -= 1;
                        currentHeight = updatePageHeight();
                        repositionBoxes();
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
     dynamicFillEmptySpace(null);
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

// Bugged
function restrictCheckBoxSelection() {
    const checkboxes = currentPageContent.querySelectorAll('input[name="academicStatus"]');
    // Add a change event listener to each checkbox
        checkboxes.forEach((checkbox) => {
            checkbox.addEventListener('change', function () {
                // Uncheck all other checkboxes in the group
                checkboxes.forEach((otherCheckbox) => {
                    if (otherCheckbox !== this) {
                        otherCheckbox.checked = false;
                    }
                });
            });
        });
}


function dropContent(boxHeight, data) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = data;
    tempDiv.classList.add('hover'); // Hover
    const newDiv = tempDiv.querySelector('.draggable');

    if (newDiv) {
        var clonedDiv = newDiv.cloneNode(true); // clone dragged element
        clonedDiv.removeAttribute("draggable"); // make it not draggable

        initializeContextMenuForChild(clonedDiv); // initialize right click functions
        clonedDiv = selectElement(clonedDiv); // add selection listener for sub-children elements
        clonedDiv = removeReadOnlyAttributesRecursive(clonedDiv); // allow elements to be editable

        if (currentPageContent) { // Check if currentPageContent is defined
            sectionCount += 1; // update section count
            const sectionDiv = document.createElement('div');
            sectionDiv.id = "section-" + currentPage + "-" + sectionCount;
            sectionDiv.appendChild(clonedDiv); // enclose dropped element to section div

            if ((currentHeight + boxHeight) > (maxHeight+padding)) {
                createNewPage(); // Current page is full, initialize a new page
            }

            if (clonedDiv.nodeName === "TEXTAREA") {
                console.log("Is a textarea");
                var addHeight = 0;
                clonedDiv.addEventListener('keydown', () => {
                    adjustTextareaHeight(clonedDiv);
                });
                console.log(currentHeight);
            } else {
                clonedDiv.style.height = 'fixed';
            }

            currentPageContent.appendChild(sectionDiv); // Append to the current page's content
            currentHeight += calculateDivHeight(clonedDiv); // Update current height
        }

        // Update page numbers
        if (currentPageContent.querySelector("header-table")) {
            updatePageNumbers();
        }

    } else {
        console.error('currentPageContent is undefined.'); // Log an error if currentPageContent is undefined
    }
}

// Calculations
function calculateDivHeight(element) {
    if (element.nodeName === "TABLE" || element.nodeName === "TH" || element.nodeName === "TD" ) {
        return element.getBoundingClientRect().height + 10;
    } else {
        return element.getBoundingClientRect().height + 5;
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
	selectedCells = [];
	const selected = table.querySelectorAll('.selectedCells');
	selected.forEach(cell => cell.classList.remove('selectedCells'));
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

		// Inside the div with class 'header', find all tables with class name 'header-table'
		const headerTable = headerContainer.querySelector('.header-table');

		const pageNumberElement = headerTable.querySelector('.page-number');
		pageNumberElement.textContent = (index) + ' of ' + totalPages;
		index += 1;
	});
}

// Update page sections positioning
function repositionBoxes() {
	const boxes = Array.from(currentPageContent.querySelectorAll('.box'));

	boxes.forEach((box) => {

		box.addEventListener('drop', (e) => {
			e.preventDefault();
			const boxes = Array.from(currentPageContent.querySelectorAll('.box'));

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

            // Set contentEditable attribute to true
            element.setAttribute('contentEditable', 'false');

            // Iterate through child elements
            const childElements = element.children;
            for (let i = 0; i < childElements.length; i++) {
                removeReadOnlyAttributesRecursive(childElements[i]);
            }
        }
    }
    return element;
}

function activateElement(clonedDiv, elementType) {
    if (userType != "Document Controller" || userType != "Super Admin") {
        return;
    }

    if (elementType === "table") {
        let selectedCells = [];

        clonedDiv.addEventListener('click', (e) => {
            const cell = e.target;

            if ((cell.tagName === 'TD' || cell.tagName === 'TH') && !cell.classList.contains('merged')) {
                if (cell.classList.contains('selectedCells')) {
                    // Deselect the cell
                    cell.classList.remove('selectedCells');
                    selectedCells = selectedCells.filter(selectedCell => selectedCell !== cell);
                } else {
                    // Select the cell
                    cell.classList.add('selectedCells'); // Tracker for cells that will be merged
                    selectedCells.push(cell);
                }
            }
        });

        // Make all cells in the table editable
        const cells = clonedDiv.querySelectorAll('td');
        cells.forEach((cell) => {
            if (!cell.classList.contains("w3-uneditable")) {
                cell.setAttribute('contenteditable', 'true');

            }
        });
        const cells_head = clonedDiv.querySelectorAll('th');
        cells_head.forEach((cell) => {
            if (!cell.classList.contains("w3-uneditable")) {
                cell.setAttribute('contenteditable', 'true');
            }
        });
    }
    return clonedDiv;
}

// Click listeners for selected elements
function selectElement(element) {
    element.addEventListener('click', function (event) {
	    const clickedElement = event.target;
	    // Unselect the previously selected text box, if any
	    if (selectedTextBox && selectedTextBox.getAttribute('id') === "selected") {
            // Check if the "id" attribute matches the selectedElement
	        selectedTextBox.removeAttribute('contentEditable');
        } else if (selectedTextBox && element.classList.contains("drop-container")) {
           selectedTextBox.removeAttribute('contentEditable');
           var pageID = 'page-' + currentPage;
           selectedTextBox.setAttribute('id', pageID);
        } else if (selectedTextBox) {
            selectedTextBox.removeAttribute('contentEditable');
        }

        if (clickedElement.classList.contains("w3-uneditable")) {
            clickedElement.setAttribute('contentEditable', 'false');
            clickedElement.setAttribute('readOnly', 'true');
        } else {
            // Select the clicked element
            clickedElement.setAttribute('contentEditable', 'true');
            // Ensure the clicked element is editable
            clickedElement.removeAttribute('readonly');
        }

        clickedElement.id = 'selectedElement';
        selectedTextBox = clickedElement; // Update pointer to selected element based on current click

	});
    return element;
}
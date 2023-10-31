// Global Variables
var activeDraggable;
var currentHeight;
var maxHeight;
var rightClickWidgetActive;
var innerContainer;
var widgetCanvas;
var tables;
var boxes;
var contextMenu;
var selectedTextBox;

var containerSize;
var parentContainerSize;
var selectedSectionContainer;

// Initialize variables
window.onload = function(){
    console.log("entered initialize");
    tables = document.querySelectorAll('.table');
    boxes = document.querySelectorAll('.box');
    contextMenu = document.createElement('div');
    widgetCanvas = document.getElementById('widget-canvas');
    selectedSectionContainer = document.getElementById('selectedElement');
    selectedTextBox = null;
    containerSize = 0;
    parentContainerSize = 0;
    padding = 36;
    activeDraggable = null;
    innerContainer = null;
    updatePageHeight();
    rightClickWidgetActive = false;

    tables.forEach((table) => {
    	table.addEventListener('dragstart', (e) => {
    	    e.dataTransfer.setData('text/html', table.outerHTML);
    		activeDraggable = table;
    	});
    });

    widgetCanvas.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/html', widgetCanvas.outerHTML);
        activeDraggable = widgetCanvas;
    });

    widgetCanvas.addEventListener('click', (e) => {
    	selectElement(widgetCanvas);
    });

    boxes.forEach((box) => {
    	box.addEventListener('dragstart', (e) => {
    	    e.dataTransfer.setData('text/html', box.outerHTML);
    		activeDraggable = box;
    	});
    });

    setMaxHeight(); // set new max height
    console.log(maxHeight);
    console.log(currentHeight);
    addEventListenerToDiv(widgetCanvas);
 };

// Page Settings
function addReadOnlyAttributesRecursive() {
    var element = document.getElementById("widgetCanvas");

    // Inner function to handle each element
    function processElement(element) {
        // Check if the element has a readonly attribute
        if (element instanceof HTMLElement && !element.hasAttribute('readonly')) {
            element.setAttribute('readonly', 'true');
        }

        //   Remove contentEditable attribute if it exists
        if (element instanceof HTMLTableCellElement && element.hasAttribute('contentEditable')) {
            element.removeAttribute('contentEditable');
        }

        // Iterate through child elements
        const childElements = element.children;
        for (let i = 0; i < childElements.length; i++) {
            processElement(childElements[i]);
        }
    }

    if (element instanceof HTMLElement) {
        processElement(element);
    }

    return element;
}


function setMaxHeight() {
    // Get all elements with the class "drop-container"
	var dropContainer = document.getElementById('widget-canvas');
	const computedStyle = getComputedStyle(dropContainer);
	// Extract the padding value
	const paddingValue = computedStyle.getPropertyValue('padding');
	console.log("padding value is: " + paddingValue);
	// Extract the numeric part of the padding value (removing 'px' or other units)
	padding = parseFloat(paddingValue);
	maxHeight = dropContainer.offsetHeight - padding;
}

// Text Editing
function changeTextColor() {
	if (selectedTextBox) {
		const selectedTextDisplay = document.getElementById("selectedTextDisplay");

		const selection = window.getSelection();
		const selectedText = selection.toString().trim();

		if (selectedText) {
			// Get the selected color from the dropdown
			const colorSelect = document.getElementById("colorSelect");
			const selectedColor = colorSelect.value;

			// Check if the selected element is an input element
			if (selectedTextBox.tagName.toLowerCase() === "input") {
				selectedTextBox.style.color = selectedColor; // Change the text color
			} else {
				// Create a new HTML structure with the selected text wrapped in a span with the new color class
				const span = document.createElement("span");
				span.className = "w3-text-" + selectedColor;
				span.textContent = selectedText;

				// Replace the selected text with the span
				const range = selection.getRangeAt(0);
				range.deleteContents();
				range.insertNode(span);
				selection.removeAllRanges(); // Clear the selection
			}
		}
	}
}

function appendCheckBoxItem(container) {
    // Get the first child element within the grid container
    var existingGridItem = container.querySelector('.grid-item');
    console.log(existingGridItem);
    if (existingGridItem) {
        // Clone the existing child element
        var newGridItem = existingGridItem.cloneNode(true);

        // Append the cloned element to the grid container
        container.appendChild(newGridItem);
    }
    console.log(container);
}


function appendGridItem(container) {
    // Clone one of the existing grid items
    var childToClone = container.querySelector(".grid-item"); // Select the first child as an example
    var newGridItem = childToClone.cloneNode(true);
    console.log(newGridItem);

    // Clear the content of the new grid item
    newGridItem.innerHTML = "";

    // Append the new grid item to the grid container
    container.appendChild(newGridItem);
}

function removeLastGridItem(container) {
    var gridItems = container.querySelectorAll(".grid-item");
    if (gridItems.length > 1) {
        var lastGridItem = gridItems[gridItems.length - 1];
        lastGridItem.remove();
    } else if (gridItems.length === 1) {
        if (confirm("There is only one section left. Confirming deletion would delete the element in the canvas. Proceed?")) {
            // If there's only one grid item, remove the entire container
            container.remove();
        }
    }
}

function makeBold() {
    if (selectedTextBox) {
  		const selectedTextDisplay = document.getElementById("selectedTextDisplay");
  		const selection = window.getSelection();
  		const selectedText = selection.toString().trim();

  		if (selectedText) {
  			// Create a new HTML structure with the selected text wrapped in a span
  			const span = document.createElement("span");
  			span.className = "w3-bold";
  			span.textContent = selectedText;

  			// Replace the selected text with the span
  			const range = selection.getRangeAt(0);
  			let currentSpan = checkForExistingTextSpan(range);
  			console.log(currentSpan);

  			if (currentSpan == null) {
  				range.deleteContents();
  				range.insertNode(span);
  			} else if (currentSpan != null && !currentSpan.classList.contains("w3-bold")) {
  				currentSpan.classList.add('w3-bold');
  				console.log(currentSpan.classList);
  			} else {
  			    console.log("removing bold style");
  				var textContent = removeElementAndReturnText(currentSpan, 'bold');
  				console.log(textContent);

  				// Append the textContent in the current span
  				currentSpan.appendChild(document.createTextNode(textContent));
  				console.log(currentSpan.classList);
  			}
  		}
  	}
  	repositionBoxes();
}

function makeUnorderedList() {
	const orderedList = document.createElement('ul');
	orderedList.setAttribute("contenteditable", "true");
	orderedList.setAttribute("id", "selected");
	orderedList.classList.add("w3-ul")l;
	const listItem = document.createElement('li');
	// Copy the content from the original h3 element to the new list item
	listItem.textContent = selectedTextBox.textContent;
	// Append the list item to the ordered list
	orderedList.appendChild(listItem);
	// Replace the original h3 element with the new ordered list
	if (selectedTextBox && selectedTextBox.parentNode) {
		selectedTextBox.parentNode.replaceChild(orderedList, selectedTextBox);
	}
}

function makeOrderedList() {
	var orderedList = document.createElement('ol');
	orderedList.setAttribute("contenteditable", "true");
	orderedList.classList.add("w3-ol")
	const listItem = document.createElement('li');

	// Copy the content from the original h3 element to the new list item
	listItem.textContent = selectedTextBox.textContent;

	// Append the list item to the ordered list
	orderedList.appendChild(listItem);

	// Add a context menu event listener to the list
	orderedList.addEventListener('contextmenu', function (e) {
		e.preventDefault(); // Prevent the default context menu from showing
		createContextMenu(e.clientX, e.clientY, orderedList, null); // Call your context menu function
	});

	orderedList = selectElement(orderedList);
	// Replace the original h3 element with the new ordered list
	if (selectedTextBox && selectedTextBox.parentNode) {
		selectedTextBox.parentNode.replaceChild(orderedList, selectedTextBox);
	}
}

function modifyOrientation() {
	const orientation = document.getElementById("modifyOrientation");
	const selectedValue = orientation.value;
	console.log(selectedValue);

	// Get all elements with the class "drop-container"
	var dropContainer = document.getElementById('widget-canvas');
	dropContainer.classList.remove("w3-box");
	dropContainer.classList.remove("w3-portrait-rectangle");
	dropContainer.classList.remove("w3-landscape-rectangle");

	if (selectedValue === "square") {
	    // Add the 'landscape' class to all drop containers
	   dropContainer.classList.add("w3-box");
	} else if (selectedValue === "portrait-rectangle") {
		// Remove the 'landscape' class from all drop containers
	    dropContainer.classList.add("w3-portrait-rectangle");
    } else if (selectedValue === "landscape-rectangle") {
		// Remove the 'landscape' class from all drop containers
	    dropContainer.classList.add("w3-landscape-rectangle");
	}
	dropContainer.classList.add("w3-box");
	const computedStyle = getComputedStyle(dropContainer);

    // Extract the padding value
    const paddingValue = computedStyle.getPropertyValue('padding');

    // Extract the numeric part of the padding value (removing 'px' or other units)
    padding = parseFloat(paddingValue);
    maxHeight = dropContainer.offsetHeight - padding;
	console.log(maxHeight);
}

function changeFontSize() {
	if (selectedTextBox) {
		const selectedTextDisplay = document.getElementById("selectedTextDisplay");
		const selection = window.getSelection();
		const selectedText = selection.toString().trim();
		if (selectedText) {
			// Get the selected color from the dropdown
			const fontSizeSelect = document.getElementById("fontSizeSelect");
			const selectedFontSize = fontSizeSelect.value;
			console.log(selectedFontSize);
			// Create a new HTML structure with the selected text wrapped in a span with the new color class
			const span = document.createElement("span");
			span.className = "w3-font-size-" + selectedFontSize;
			span.textContent = selectedText;
			// Replace the selected text with the span
			const range = selection.getRangeAt(0);
			let currentSpan = checkForExistingTextSpan(range);
			if (currentSpan != null) {
				// Check if the current span already has a color class
				const currentColorClass = Array.from(currentSpan.classList).find(cls => cls.startsWith("w3-font-size-"));
				if (currentColorClass) {
					// Remove the current color class
					currentSpan.classList.remove(currentColorClass);
				}
				// Add the new color class
				currentSpan.classList.add("w3-font-size-" + selectedFontSize);
			} else {
				range.deleteContents();
				range.insertNode(span);
				selection.removeAllRanges(); // Clear the selection
			}
        }
	}
}

function makeUnderline() {
    if (selectedTextBox) {
		const selectedTextDisplay = document.getElementById("selectedTextDisplay");

		const selection = window.getSelection();
		const selectedText = selection.toString().trim();

		if (selectedText) {
			// Create a new HTML structure with the selected text wrapped in a span
			const span = document.createElement("span");
			span.className = "w3-underline";
			span.textContent = selectedText;

			// Replace the selected text with the span
			const range = selection.getRangeAt(0);
			let currentSpan = checkForExistingTextSpan(range);
			console.log(currentSpan);

			if (currentSpan == null) {
			    range.deleteContents();
			    range.insertNode(span);
			} else if (currentSpan != null && !currentSpan.classList.contains("w3-underline")) {
				currentSpan.classList.add('w3-underline');
			} else {
				var textContent = removeElementAndReturnText(currentSpan, 'w3-underline');
				// Append the textContent in the current span
				currentSpan.appendChild(document.createTextNode(textContent));
			}
		}
	}
	repositionBoxes();
}

function makeItalic() {
    if (selectedTextBox) {
		const selectedTextDisplay = document.getElementById("selectedTextDisplay");
		const selection = window.getSelection();
		const selectedText = selection.toString().trim();

		if (selectedText) {
			// Create a new HTML structure with the selected text wrapped in a span
			const span = document.createElement("span");
			span.className = "w3-italic";
			span.textContent = selectedText;

			// Replace the selected text with the span
			const range = selection.getRangeAt(0);
			let currentSpan = checkForExistingTextSpan(range);
			console.log(currentSpan);

			if (currentSpan == null) {
				range.deleteContents();
				range.insertNode(span);
			} else if (currentSpan != null && !currentSpan.classList.contains("w3-italic")) {
				currentSpan.classList.add('w3-italic');
			} else {
				var textContent = removeElementAndReturnText(currentSpan, 'w3-italic');

				// Append the textContent in the current span
				currentSpan.appendChild(document.createTextNode(textContent));
			}
		}
	}
	repositionBoxes();
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
function checkForExistingTextSpan(range) {
	const container = range.commonAncestorContainer;
	// Define an array of class names to check
	const classNames = ['w3-bold', 'w3-italic', 'w3-underline', 'w3-left-align',
	'w3-right-align', 'w3-center', 'w3-justify', 'w3-text-red', 'w3-text-blue', 'w3-text-grey', 'w3-text-white',
	'w3-text-black', 'w3-font-size-1', 'w3-font-size-2', 'w3-font-size-3', 'w3-font-size-4', 'w3-font-size-5',
	'w3-font-size-6', 'w3-font-size-7', 'w3-font-size-8', 'w3-font-size-9', 'w3-font-size-10', 'w3-font-size-11',
	 'w3-font-size-12', 'w3-font-size-13', 'w3-font-size-14', 'w3-font-size-15', 'w3-font-size-16',
	 'w3-font-size-17', 'w3-font-size-18', 'w3-font-size-19', 'w3-font-size-20', 'w3-font-size-21',
	 'w3-font-size-22', 'w3-font-size-23', 'w3-font-size-24', 'w3-font-size-25', 'w3-font-size-26',
	 'w3-font-size-27', 'w3-font-size-28', 'w3-font-size-29', 'w3-font-size-30', 'w3-font-size-31',
	 'w3-font-size-32', 'w3-font-size-33', 'w3-font-size-34', 'w3-font-size-35', 'w3-font-size-36',
	 'w3-font-size-37', 'w3-font-size-38', 'w3-font-size-39', 'w3-font-size-40', 'w3-font-size-41',
	 'w3-font-size-42', 'w3-font-size-43', 'w3-font-size-44', 'w3-font-size-45', 'w3-font-size-46',
	 'w3-font-size-47', 'w3-font-size-48', 'w3-font-size-49', 'w3-font-size-50', 'w3-font-size-51',
	 'w3-font-size-52', 'w3-font-size-53', 'w3-font-size-54', 'w3-font-size-55', 'w3-font-size-56',
	 'w3-font-size-57', 'w3-font-size-58', 'w3-font-size-59', 'w3-font-size-60', 'w3-font-size-61',
	 'w3-font-size-62', 'w3-font-size-63', 'w3-font-size-64', 'w3-font-size-65', 'w3-font-size-66',
	 'w3-font-size-67', 'w3-font-size-68', 'w3-font-size-69', 'w3-font-size-70', 'w3-font-size-71',
	  'w3-font-size-72', 'w3-font-size-73', 'w3-font-size-74', 'w3-font-size-75', 'w3-font-size-76',
	  'w3-font-size-77', 'w3-font-size-78', 'w3-font-size-79', 'w3-font-size-80', 'w3-font-size-81',
	  'w3-font-size-82', 'w3-font-size-83', 'w3-font-size-84', 'w3-font-size-85', 'w3-font-size-86',
	  'w3-font-size-87', 'w3-font-size-88', 'w3-font-size-89', 'w3-font-size-90', 'w3-font-size-91',
	  'w3-font-size-92', 'w3-font-size-93', 'w3-font-size-94', 'w3-font-size-95', 'w3-font-size-96',
	  'w3-font-size-97', 'w3-font-size-98', 'w3-font-size-99', 'w3-font-size-100'];

	// Function to check if an element has any of the specified classes
	function hasAnyClass(element) {
		return classNames.some(className => element.classList.contains(className));
	}

	// Traverse the DOM tree upwards from the selection container
	let currentNode = range.startContainer;
	console.log(currentNode);
	while (currentNode) {
		if (currentNode.nodeType === Node.ELEMENT_NODE && hasAnyClass(currentNode)) {
			return currentNode;
		}
		currentNode = currentNode.parentElement;
	}
	return null;
}

// Table Functions
function mergeCells(table) {
	const selectedCells = getSelectedCells(table);
	console.log(selectedCells);
	if (selectedCells.length < 2) {
		alert('Select at least two cells to merge.');
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

	console.log('Same Row:', sameRow);
	console.log('Same Column:', sameColumn);

	if (sameRow) {
		// If in the same row, set colspan to the number of selected cells
		colspan = selectedCells.length;
		console.log('Colspan:', colspan);
	} else if (sameColumn) {
		// If in different rows, set rowspan to the number of selected cells
		rowspan = selectedCells.length;
		console.log('Rowspan:', rowspan);
	} else {
	   // Calculate equivalent colspan and rowspan based on the positions of selected cells
		const firstRowIndex = firstCell.parentElement.rowIndex;
		const lastRowIndex = selectedCells[selectedCells.length - 1].parentElement.rowIndex;
		const firstCellIndex = firstCell.cellIndex;
		const lastCellIndex = selectedCells[selectedCells.length - 1].cellIndex;

		// Calculate colspan and rowspan based on cell positions
		colspan = lastCellIndex - firstCellIndex + 1;
		rowspan = lastRowIndex - firstRowIndex + 1;
		console.log('Colspan:', colspan);
		console.log('Rowspan:', rowspan);
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
		alert('Select a merged cell to unmerge.');
		return;
	}

	// Store the first cell's position and content
	const firstCell = selectedCells[0];
	const rowIndex = firstCell.parentElement.rowIndex;
	const cellIndex = firstCell.cellIndex;

	console.log(cellIndex);

	const rowspan = parseInt(firstCell.getAttribute('rowspan')) || 1;
	const colspan = parseInt(firstCell.getAttribute('colspan')) || 1;

	console.log(rowspan);
	console.log(colspan);

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
			console.log(i);
			const newRow = table.rows[rowIndex + i];
			console.log("Row index: " + (rowIndex + i));
			console.log(newRow);

			if (newRow) {

				for (let j = 0; j < colspan; j++) {
					const newCell = document.createElement('td');
					newCell.textContent = originalContent;

				console.log(table.rows[0].cells.length);
				console.log(newRow.cells.length);
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

function removeTableRow(table, rowIndex) {
	if (table.rows.length > 1) {
		table.deleteRow(rowIndex);
	} else {
		alert("Cannot remove the last row.");
	}
}

function removeTableColumn(table, columnIndex) {
	const numRows = table.rows.length;

	if (numRows > 0) {
		for (let i = 0; i < numRows; i++) {
			const row = table.rows[i];
			if (row.cells.length > 1) {
				row.deleteCell(columnIndex);
			} else {
				alert("Cannot remove the last cell in a row.");
			}
		}
	}
}

function addTableRow(table) {
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

	for (let i = 0; i < rowColCount; i++) {
		const cell = newRow.insertCell(i);
		cell.contentEditable = true;
		cell.textContent = '';
	}
}


function addTableColumn(table) {
	const numRows = table.rows.length;
	for (let i = 0; i < numRows; i++) {
		const newRow = table.rows[i];
		const cell = newRow.insertCell(newRow.cells.length);
		cell.contentEditable = true;
		cell.textContent = '';
	}
}

// Context Menus
function createContextMenu(x,y,element, table) {
    console.log(element.classList);
    if (rightClickWidgetActive) {
        while (contextMenu.firstChild) {
            contextMenu.removeChild(contextMenu.firstChild);
        }
        rightClickWidgetActive = false;
    } else {
        contextMenu.classList.add('context-menu');

        if (table) {
            if (element.classList.contains('table')) {
                contextMenuButtonsForTable(element, contextMenu);
            }
        }

        contextMenuButtonsForContainer(element, contextMenu);

        var isChild = false;
        var deleteButtonSelected;
        var parentContainer = selectedTextBox.parentElement;
        console.log(parentContainer);

        if (parentContainer.classList.contains("container")) {
            isChild = true;
            deleteButtonSelected = document.createElement('button');
            deleteButtonSelected.classList.add("button-box");
            deleteButtonSelected.innerText = 'Delete Inner Widget';

            deleteButtonSelected.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete selected widget?')) {
                   selectedTextBox.remove();
                    updatePageHeight();
                    repositionBoxes();
                }
            });
        }


        const deleteButtonGroup = document.createElement('button');
        deleteButtonGroup.classList.add("button-box");
        deleteButtonGroup.innerText = 'Delete Widget';
        deleteButtonGroup.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this box?')) {
                element.remove();
                updatePageHeight();
                repositionBoxes();
            }
        });

        contextMenu.appendChild(deleteButtonGroup);
        if (isChild) {
            contextMenu.appendChild(deleteButtonSelected);
            isChild = false;
        }

        console.log("got here");

        const lockEditOnDeploy = document.createElement('button');
        lockEditOnDeploy.classList.add("button-box");
        lockEditOnDeploy.innerText = "Lock this field on deployment";
        lockEditOnDeploy.addEventListener('click', () => {
            if(confirm('Are you sure you want to lock this editable field on deployment?')) {
                makeInputUneditableOnDeployment();
            }
            contextMenu.remove();
        })
        contextMenu.appendChild(lockEditOnDeploy);

        const unlockEditOnDeploy = document.createElement('button');
        unlockEditOnDeploy.classList.add("button-box");
        unlockEditOnDeploy.innerText = "Unlock this field on deployment";
        unlockEditOnDeploy.addEventListener('click', () => {
            if(confirm('Are you sure you want to unlock this editable field on deployment?')) {
                makeInputEditableOnDeployment();
            }
            contextMenu.remove();
        })
        contextMenu.appendChild(unlockEditOnDeploy);

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

function contextMenuButtonsForContainer(element, contextMenu) {
    var appendSectionColumn;
    var addCheckBoxItem;
    var removeSectionColumn;
    // Add right click functions for grid container
    if (element.classList.contains('grid-container') && !element.classList.contains('checkbox')) {

        // Add Section column
        appendSectionColumn = document.createElement('button');
        appendSectionColumn.classList.add("button-section");
        appendSectionColumn.innerText = 'Add Section Column';
        appendSectionColumn.addEventListener('click', () => {
            if(confirm('Add another section?')) {
                element = appendGridItem(element);
                console.log(element);
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

    } if (element.classList.contains('grid-container') && element.classList.contains('checkbox')) {
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
    return contextMenu;
}

function contextMenuButtonsForTable(element, contextMenu) {
    const addRowButton = document.createElement('button');
    addRowButton.classList.add("button-table");
    addRowButton.innerText = 'Add Row';

    addRowButton.addEventListener('click', () => {
     addTableRow(table);
     contextMenu.remove();
     updatePageHeight();
    });

    const addColumnButton = document.createElement('button');
    addColumnButton.classList.add("button-table");
    addColumnButton.innerText = 'Add Column';

    addColumnButton.addEventListener('click', () => {
        addTableColumn(table);
        contextMenu.remove();
    });

    const removeRowButton = document.createElement('button');
    removeRowButton.classList.add("button-table");
    removeRowButton.innerText = 'Remove Row';

    removeRowButton.addEventListener('click', () => {
        var rowCount = table.rows.length;
        removeTableRow(table, rowCount-1);
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
    	const table = element.querySelector('table');
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

    contextMenu.appendChild(mergeCellsButton);
    contextMenu.appendChild(unmergeCellButton);
    contextMenu.appendChild(addRowButton);
    contextMenu.appendChild(addColumnButton);
    contextMenu.appendChild(removeRowButton);
    contextMenu.appendChild(removeColumnButton);

    return contextMenu;
}

// Calculations
function calculateDivHeight(element) {
    return element.getBoundingClientRect().height + 20;
}


// Miscellaneous
	function clearSelection(table) {
		selectedCells = [];
		const selected = table.querySelectorAll('.selected');
		selected.forEach(cell => cell.classList.remove('selected'));
	}

	function getSelectedCells(table) {
		const selectedCells = [];
		const cells = table.querySelectorAll('.selected');

		cells.forEach(cell => {
			selectedCells.push(cell);
		});
		return selectedCells;
	}

function reassignSectionID() {
	// Update the IDs of the remaining sections
	const sections = widgetCanvas.querySelectorAll('div[id^="section-"]');
	sections.forEach((section, index) => {
		section.id = `section-${index + 1}`;
	});
}

function repositionBoxes() {
	const boxes = Array.from(widgetCanvas.querySelectorAll('.table'));
	boxes.forEach((box) => {
		box.addEventListener('drop', (e) => {
			e.preventDefault();
			const boxes = Array.from(dropBox.querySelectorAll('.box'));

			if (activeDraggable) {
				const draggedIndex = boxes.indexOf(activeDraggable);
				const currentIndex = boxes.indexOf(box);
				if (draggedIndex !== currentIndex) {
					const referenceIndex = draggedIndex < currentIndex ? currentIndex + 1 : currentIndex;
					dropBox.insertBefore(activeDraggable, boxes[referenceIndex]);
					repositionBoxes();
				}
			}
		});
	});
}


function addNewGridItem(gridContainer) {
    // Replicate the first child of the provided grid container
    var firstChild = gridContainer.querySelector('.grid-item').cloneNode(true);

    // Change the ID, value, and text for the replicated input element and label
    var newId = 'item-' + Date.now();

    firstChild.querySelector('input').id = newId;
    firstChild.querySelector('input').value = 'new-item';
    firstChild.querySelector('label').htmlFor = newId;
    firstChild.querySelector('label').textContent = 'New Grid Item';

    // Append the replicated item to the grid container
    gridContainer.appendChild(firstChild);

    return gridContainer;
}

function addEventListenerToDiv(dropBox) {
	dropBox.addEventListener('dragover', (e) => {
		e.preventDefault();
		dropBox.classList.add('hover');
	});

	dropBox.addEventListener('dragleave', () => {
		dropBox.classList.remove('hover');
	});

    dropBox.addEventListener('drop', (e) => {
        var isContainer = false;
        e.preventDefault();
        console.log("New max height is: " + maxHeight);
        dropBox.classList.remove('hover');

        if (activeDraggable) {
            const boxHeight = calculateDivHeight(activeDraggable);
            console.log(currentHeight + " is the current height");
            console.log(boxHeight + " is the new element height");
            console.log(currentHeight + boxHeight + "px");

            if (currentHeight + boxHeight > maxHeight) {
              alert("The page is already full. Delete content to drag more elements.");
              return; // Return and do not drag anything
            }

            const data = e.dataTransfer.getData('text/html');
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = data;

            const newDiv = tempDiv.querySelector('.draggable');

            if (newDiv) {
                var clonedDiv = newDiv.cloneNode(true);
                console.log(clonedDiv.classList);
                // Check if the clonedDiv is a table
                console.log(clonedDiv.classList);

                // Check if the clonedDiv is a table or contains tables within divs
                if (clonedDiv.nodeName.toLowerCase() === 'table') {
                  clonedDiv.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    createContextMenu(e.clientX, e.clientY, clonedDiv, null);
                  });
                  clonedDiv = activateTable(clonedDiv);

                } else if (selectedTextBox != null) {
                    console.log("hi");
                    if (selectedTextBox.classList.contains("grid-item")) {
                        console.log("section is a container");
                        addEventListenerToDiv(selectedTextBox);
                        containerSize = boxHeight;
                        console.log("marker--");
                        isContainer = true;
                        const data = e.dataTransfer.getData('text/html');
                        // Create a temporary container to parse and append the data
                        const tempContainer = document.createElement('div');
                        tempContainer.innerHTML = data;
                        tempContainer.firstChild.removeAttribute("draggable");
                        selectedTextBox.appendChild(tempContainer.firstChild);
                        // Remove the 'draggable' attribute
                        selectedTextBox.removeAttribute("draggable");
                        activeDraggable = null;
                        updatePageHeight();
                        return;
                    }
                } else {
                    clonedDiv.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        createContextMenu(e.clientX, e.clientY, clonedDiv, null);
                    });
                }

                clonedDiv.addEventListener('click', (e) => {
            e.preventDefault();
            selectElement(clonedDiv);
        });

            clonedDiv = selectElement(clonedDiv);
            clonedDiv.removeAttribute("draggable");
            //clonedDiv.classList.remove("draggable");
            //      if (isContainer) {
            //        isContainer = false;
            //        updatePageHeight();
            //        return;
            //      } else

            if (widgetCanvas) { // Check if widgetCanvas is defined
                widgetCanvas.appendChild(clonedDiv);
                currentHeight += boxHeight;
            } else {
                console.error('widgetCanvas is undefined.');
            }
                activeDraggable = null;
            }
        }
    });
}

function updatePageHeight() {
	var tempHeight = 0;
	// Iterate through all child elements of widgetCanvas
	const childElements = widgetCanvas.children;
	for (let i = 0; i < childElements.length; i++) {
		const childElement = childElements[i];
		// Calculate the height of the current child element and add it to currentHeight
		tempHeight += calculateDivHeight(childElement);
	}
	currentHeight = tempHeight;
	console.log("Current Page Height is: " + tempHeight);
	return tempHeight;
}

function activateTable(clonedDiv) {
    let selectedCells = [];

	clonedDiv.addEventListener('click', (e) => {
	    const cell = e.ta
	    if (cell.tagName === 'TD' && !cell.classList.contains('merged') || cell.tagName === 'TH' && !cell.classList.contains('merged')) {
	    	if (cell.classList.contains('selected')) {
	    		// Deselect the cell
	    		cell.classList.remove('selected');
	    		selectedCells = selectedCells.filter(selectedCell => selectedCell !== cell);
	    	} else {
	    		// Select the cell
	    		cell.classList.add('selected');
	    		selectedCells.push(cell);
	    	}
	    }
	});

	// Make all cells in the table editable
	const cells = clonedDiv.querySelectorAll('td');
	cells.forEach((cell) => {
		cell.setAttribute('contenteditable', 'true');
	});
	const cells_head = clonedDiv.querySelectorAll('th');
	cells_head.forEach((cell) => {
		cell.setAttribute('contenteditable', 'true');
	});

    return clonedDiv;
}

function removeElementAndReturnText(element, classname) {
	let textContent = '';

	// Check if the element has the specified class name
	if (element.classList.contains(classname)) {
		// Get the text content before removing the element
		textContent = element.textContent;

		// Create a text node with the element's text content
		const textNode = document.createTextNode(textContent);

		// Insert the text node before the element (i.e., replace the element)
		element.parentNode.insertBefore(textNode, element);

		// Remove the element
		element.remove();
	}

	// Return the text content
	return textContent;
}

function selectElement(element) {
    element.addEventListener('click', function (event) {
	    const clickedElement = event.target;
	    // Unselect the previously selected text box, if any
	    if (selectedTextBox && selectedTextBox.getAttribute('id') === "selectedElement") {
	        console.log("sel check");
            // Check if the "id" attribute matches the selectedElement
	        selectedTextBox.removeAttribute('contentEditable');
        } else if (selectedTextBox) {
            selectedTextBox.removeAttribute('contentEditable');
        } else if (selectedTextBox && element.classList.contains("w3-box")) {
            selectedTextBox.setAttribute('id', 'widgetCanvas');
        }

		// Select the clicked element
		clickedElement.setAttribute('contentEditable', 'true');
		clickedElement.id = 'selectedElement';
		selectedTextBox = clickedElement;

        console.log(selectedTextBox.classList);
		selectedTextBox.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (selectedTextBox.classList.contains("selected")) {
            createContextMenu(e.clientX, e.clientY, null, selectedTextBox);
            } else if (selectedTextBox.classList.contains("w3-box")) {
            return;
            } else {
             createContextMenu(e.clientX, e.clientY, selectedTextBox, null) ;
            }
        });

		// Ensure the clicked element is editable
		clickedElement.removeAttribute('readonly');
	});
    console.log(element);
    return element;
}
const draggable = document.querySelectorAll('.draggable');
let activeDraggable = null;
var sectionCount = 0;
var isFirstElement = true;
let currentHeight = 0;
var maxHeight = 1020; // A4 height in pixels
//var dropContainer = document.getElementById('widget-canvas');
let widgetCanvas = document.getElementById('widget-canvas'); // Reference to the current page's content
const containerDiv = document.getElementById('outer-container');
let isSelecting = false;
let startCell = null;
const tables = document.querySelectorAll('.table');
const contextMenu = document.createElement('div');
var rightClickWidgetActive = false;

// Keep track of the currently hovered text box
let selectedTextBox = null;

// Element Initialization
tables.forEach((table) => {
	let selectedCells = [];

	table.addEventListener('dragstart', (e) => {
				e.dataTransfer.setData('text/html', table.outerHTML);
				activeDraggable = table;
			});
	});

// Page Settings
function setMaxHeight() {
  // Get all elements with the class "drop-container"
	  var dropContainers = document.querySelectorAll('.drop-container');
dropContainers.forEach(function (dropContainer) {
			const computedStyle = getComputedStyle(dropContainer);
			// Extract the padding value
			const paddingValue = computedStyle.getPropertyValue('padding');
			console.log("padding value is: " + paddingValue);
			// Extract the numeric part of the padding value (removing 'px' or other units)
			padding = parseFloat(paddingValue);
			maxHeight = dropContainer.offsetHeight - padding;
		});
}
setMaxHeight();
console.log("Max Height is: " + maxHeight);


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

            // There is no span element
            if (currentSpan == null) {
                        range.deleteContents();
                        range.insertNode(span);

            // The span exists but there is no bold style in the classlist
            } else if (currentSpan != null && !currentSpan.classList.contains("w3-bold")) {
                currentSpan.classList.add('w3-bold');

            //
            } else {
                var textContent = removeElementAndReturnText(currentSpan, 'w3-bold');

                // Append the textContent in the current span
                currentSpan.appendChild(document.createTextNode(textContent));
            }
        }
    }
    repositionBoxes();
}


function makeUnorderedList() {
	 const orderedList = document.createElement('ul');
			orderedList.setAttribute("contenteditable", "true");
			orderedList.setAttribute("id", "selected");
			orderedList.classList.add("w3-ul")
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
			createContextMenuBox(e.clientX, e.clientY, orderedList); // Call your context menu function
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
	span.className = "w3-underline"; // Initialize with the desired class name

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
    if (rightClickWidgetActive) {
            while (contextMenu.firstChild) {
              contextMenu.removeChild(contextMenu.firstChild);
            }
            rightClickWidgetActive = false;
    } else {
    contextMenu.classList.add('context-menu');
        if (table) {
          console.log("pakyu");
                	if (element.classList.contains('table')) {
                		const addRowButton = document.createElement('button');
                		addRowButton.innerText = 'Add Row';
                		addRowButton.addEventListener('click', () => {
                			addTableRow(element);
                			contextMenu.remove();
                		});

                		const addColumnButton = document.createElement('button');
                		addColumnButton.innerText = 'Add Column';
                		addColumnButton.addEventListener('click', () => {
                			addTableColumn(element);
                			contextMenu.remove();
                		});

                		const removeRowButton = document.createElement('button');
                		removeRowButton.innerText = 'Remove Row';
                		removeRowButton.addEventListener('click', () => {
                			var rowCount = element.rows.length;
                			removeTableRow(element, rowCount-1);
                			contextMenu.remove();
                		});


                		const removeColumnButton = document.createElement('button');
                		removeColumnButton.innerText = 'Remove Column';
                		removeColumnButton.addEventListener('click', () => {
                			const colCount = element.rows[0].cells.length;
                			removeTableColumn(element, colCount-1);
                			contextMenu.remove();
                		});


                		const mergeCellsButton = document.createElement('button');
                		mergeCellsButton.innerText = 'Merge Cells';
                		mergeCellsButton.addEventListener('click', () => {
                			const table = element.querySelector('table');
                			mergeCells(element);
                			contextMenu.remove();
                		});

                		const unmergeCellButton = document.createElement('button');
                		unmergeCellButton.innerText = 'Unmerge Cell';
                		unmergeCellButton.addEventListener('click', () => {
                		   unmergeCells(element);
                			contextMenu.remove();
                		});

                		contextMenu.appendChild(mergeCellsButton);
                		contextMenu.appendChild(unmergeCellButton);
                		contextMenu.appendChild(addRowButton);
                		contextMenu.appendChild(addColumnButton);
                		contextMenu.appendChild(removeRowButton);
                		contextMenu.appendChild(removeColumnButton);
                	}
        }

        if (element.classList.contains('draggable')) {
                			const deleteButton = document.createElement('button');
                			deleteButton.innerText = 'Delete Widget Field';
                			deleteButton.addEventListener('click', () => {
                				if (confirm('Are you sure you want to delete this box?')) {
                					const parentContainer = element.parentElement;
                					if (parentContainer) {
                						parentContainer.remove(); // Remove the parent container
                						sectionCount -= 1;
                						reassignSectionID();
                					}
                //                    element.remove();
                					repositionBoxes();
                					checkCurrentPage();
                				}
                				contextMenu.remove();
                			});

                			contextMenu.appendChild(deleteButton);
                		}

	                contextMenu.style.position = 'fixed';
                	contextMenu.style.left = x + 'px';
                	contextMenu.style.top = y + 'px';
                	document.body.appendChild(contextMenu);

                	document.addEventListener('click', () => {
                		contextMenu.remove();
                	});

                	// Prevent the default context menu from appearing
                	document.addEventListener('contextmenu', (e) => {
                		e.preventDefault();
                	});
                	rightClickWidgetActive = true;
    }

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
	const boxes = Array.from(dropBox.querySelectorAll('.box'));

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
  console.log("New max height is: " + maxHeight);
  dropBox.classList.remove('hover');

  if (activeDraggable) {
    const boxHeight = calculateDivHeight(activeDraggable);
    if (isFirstElement == true) {
      header_height = boxHeight;
      isFirstElement = false;
      console.log(header_height);
    }
    console.log(header_height);
    console.log(currentHeight + " is the current height");
    console.log(boxHeight + " is the new element height");
    console.log(currentHeight + boxHeight + "px");
    if (currentHeight + boxHeight > (maxHeight)) {
      widgetCanvas.style.pageBreakAfter = 'always'; // Add page break after the current page
      currentHeight = 0 + header_height; // Reset current height for the new page
    }
    sectionCount += 1;
    const data = e.dataTransfer.getData('text/html');
    const sectionDiv = document.createElement('div');
    sectionDiv.id = "section-" + sectionCount;
    sectionDiv.classList.add("table");

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = data;

    const newDiv = tempDiv.querySelector('.draggable');

    if (newDiv) {
      var clonedDiv = newDiv.cloneNode(true);
      clonedDiv.removeAttribute("draggable");

      // Check if the clonedDiv is a table
      console.log(clonedDiv.nodeName.toLowerCase());

      // Check if the clonedDiv is a table or contains tables within divs
      if (clonedDiv.nodeName.toLowerCase() === 'table') {
        clonedDiv.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          createContextMenuTable(e.clientX, e.clientY, clonedDiv);
        });
        clonedDiv = activateTable(clonedDiv);
      } else {
        console.log(clonedDiv);
        clonedDiv.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          createContextMenu(e.clientX, e.clientY, clonedDiv);
        });
      }

      clonedDiv = selectElement(clonedDiv);

      if (widgetCanvas) { // Check if widgetCanvas is defined
        sectionDiv.appendChild(clonedDiv);
        widgetCanvas.appendChild(sectionDiv); // Append to the current page's content
        currentHeight += boxHeight; // Update the current height
        console.log(currentHeight);
      } else {
        console.error('widgetCanvas is undefined.'); // Log an error if widgetCanvas is undefined
      }
    }

    activeDraggable = null;
  } else {
    // Handle the drop action for the "container" elements
    const containers = document.querySelectorAll('.container');

    containers.forEach(container => {
      if (container.contains(e.target)) {
        const data = e.dataTransfer.getData('text/html');
        const widget = document.createElement('div');
        widget.innerHTML = data;

        // Add the widget to the container
        container.appendChild(widget);
      }
    });
  }
});
}

function checkCurrentPageHeight() {
	var tempHeight = 0;
	// Iterate through all child elements of widgetCanvas
	const childElements = widgetCanvas.children;
	for (let i = 0; i < childElements.length; i++) {
		const childElement = childElements[i];
		// Calculate the height of the current child element and add it to currentHeight
		tempHeight += calculateDivHeight(childElement);
	}
	console.log("Current Page Height is: " + tempHeight);
	return tempHeight;
}

function activateTable(clonedDiv) {

							let selectedCells = [];
							clonedDiv.addEventListener('click', (e) => {
										const cell = e.target;

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
		   if (selectedTextBox) {
			   selectedTextBox.removeAttribute('id');
		   }

		   // Select the clicked element
		   clickedElement.setAttribute('contentEditable', 'true');
		   clickedElement.id = 'selected';
		   selectedTextBox = clickedElement;

		   // Ensure the clicked element is editable
		   clickedElement.removeAttribute('readonly');
	   });

		   console.log(element);
//		   // Add the context menu event listener to it
//					   element.addEventListener('contextmenu', (e) => {
//							 e.preventDefault();
//							 console.log("Fired!!!!");
//							 createContextMenuBox(e.clientX, e.clientY, element);
//					   });
   return element;
   }

addEventListenerToDiv(widgetCanvas);


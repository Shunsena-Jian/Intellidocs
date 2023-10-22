var currentPage;
var currentHeight;
var maxHeight;
var header_height;
var rightClickWidgetActive;
var dropBox;
var dropContainers;
var containerDiv;
var contextMenu;

window.onload = function(){
    console.log("entered initialize");
    contextMenu = document.createElement('div');
    containerDiv = document.getElementById('outer-container');
    dropBox = document.querySelector('.drop-container');
    dropContainers = document.querySelectorAll('.drop-container');
    currentPage = dropContainers.length;
    setMaxHeight(); // set new max height
    header_height = 0; // calculate header height
    padding =
    rightClickWidgetActive = false;

    console.log(currentPage);
    console.log(dropContainers);
};



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


function createNewPage() {
	updatePageNumbers();
	console.log("new page tanga!!!");
	currentPage++;
	const newPage = document.createElement('div');
	newPage.classList.add('drop-container', 'draggable'); // Add custom class names including 'draggable'
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
			const headerClone = headerDiv.cloneNode(true);
			// Remove the click listener
			headerClone.removeEventListener('click', createContextMenuBox);
			newPage.appendChild(headerClone);
		}
	}

	//downloadPDF(newPage);
	addEventListenerToDiv(newPage);
	return newPage;
}


function removeTableRow(table, rowIndex) {
	if (table.rows.length > 1) {
		table.deleteRow(rowIndex);
	} else {
		alert("Cannot remove the last row.");
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



// Context Menu
function createContextMenuTable(x, y, element) {
    //const contextMenu = document.createElement('div');
	if(rightClickWidgetActive){
        // Get all button elements with the class "box" within the contextMenu div
        const buttonsWithBoxClass = contextMenu.querySelectorAll('button.button-table');

        if (buttonWithBoxClass) {
            return;
        } else {
            console.log("Nothing!");
        }
	    rightClickWidgetActive = false;
	}else{
	    rightClickWidgetActive = true;
        	contextMenu.classList.add('context-menu');
        	if (element.classList.contains('table')) {
        		const addRowButton = document.createElement('button');
        		addRowButton.classList.add("button-table");
        		addRowButton.innerText = 'Add Row';
        		addRowButton.addEventListener('click', () => {
        			addTableRow(element);
        			contextMenu.remove();
        		});


        		const removeRowButton = document.createElement('button');
        		removeRowButton.classList.add("button-table");
        		removeRowButton.innerText = 'Remove Row';
        		removeRowButton.addEventListener('click', () => {
        			var rowCount = element.rows.length;
        			removeTableRow(element, rowCount-1);
        			contextMenu.remove();
        		});

        		contextMenu.appendChild(addRowButton);
        		contextMenu.appendChild(removeRowButton);
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
	}
}

// Calculations
function calculateDivHeight(element) {
return element.getBoundingClientRect().height + 20;
}

function resizeBoxHeight(box, deltaHeight) {
	const currentHeight = calculateDivHeight(box);
	const newHeight = currentHeight + deltaHeight;

	if (newHeight >= 0) {
		box.style.height = newHeight + 'px';

		// Adjust the content inside the box
		const content = box.querySelector('.draggable-content');
		if (content) {
			content.style.height = (newHeight) + 'px';
		}
	}
}

// Miscellaneous

	function clearSelection(table) {
		selectedCells = [];
		const selected = table.querySelectorAll('.selectedTable');
		selected.forEach(cell => cell.classList.remove('selectedTable'));
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
	// Update the IDs of the remaining sections
	const sections = currentPageContent.querySelectorAll('div[id^="section-"]');
	sections.forEach((section, index) => {
		section.id = `section-${index + 1}`;
	});
}

function checkCurrentPage() {
	var numberOfChildren = currentPageContent.childElementCount;
   console.log(numberOfChildren);
   console.log(currentPageContent.id);

   // Do nothing if current page is the first page
   if (currentPageContent.id != "page-1") {
		if (numberOfChildren == 1) {
			var prevpage = currentPage - 1;
			var pageIDString = "page-" + prevpage;
			let dropContainers = document.querySelectorAll('.drop-container');
			let found = false;
			console.log(dropContainers);

			dropContainers.forEach(dropContainer => {
				console.log(dropContainer.id);
				if (dropContainer.id == pageIDString) {
					 // Get the parent element of currentPageContent
						const currentPageParent = currentPageContent.parentElement;

						// Remove currentPageContent from its parent
						currentPageParent.removeChild(currentPageContent);

						// Set dropContainer as the new currentPageContent
						currentPageContent = dropContainer;


					return;
				}
			});
		currentPage -=1;
		}
   }
   console.log(currentPageContent.id);
   console.log(currentPage);
   currentHeight = checkCurrentPageHeight();
}

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


function checkCurrentPageHeight() {
	var tempHeight = 0;
	// Iterate through all child elements of currentPageContent
	const childElements = currentPageContent.children;
	for (let i = 0; i < childElements.length; i++) {
		const childElement = childElements[i];
		// Calculate the height of the current child element and add it to currentHeight
		tempHeight += calculateDivHeight(childElement);
	}
	console.log("Current Page Height is: " + tempHeight + padding);
	return tempHeight + padding;
}


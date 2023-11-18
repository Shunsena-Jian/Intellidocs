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
    isFirstElement = true;
    setMaxHeight(); // set new max height
    header_height = 0; // calculate header height
    padding = 36;
    currentHeight = 0 + padding;
    rightClickWidgetActive = false;

    // Keep track of the currently hovered text box
    selectedTextBox = null;

    initializeDraggables();
    if (currentPageContent.childElementCount > 0) {
        console.log("currentPageContent has content:", currentPageContent);
        initializeCurrentPage();
    } else {
        console.log("currentPageContent is empty or falsy:", currentPageContent);
    }

    currentPageContent.addEventListener('click', (e) => {
        console.log("added listener to " + currentPageContent.id);
    	selectElement(currentPageContent);
    });


    addEventListenerToDiv(currentPageContent);
};

function adjustTextareaHeight(textarea) {
    var parentContainer = textarea.parentElement;
    var pageContainer = parentContainer.parentElement;
    var pageHeight = 0 + padding;
    var oldTextAreaHeight = parseInt(textarea.style.height); // 137px
    var newTextAreaHeight = parseInt(textarea.scrollHeight);
    var addedHeight = newTextAreaHeight - oldTextAreaHeight;

    console.log(pageContainer);

    console.log("Old: " + oldTextAreaHeight);
    console.log("New: " + newTextAreaHeight);
    console.log("Current Height: " + currentHeight);

    if (newTextAreaHeight > oldTextAreaHeight) {
         // Iterate through all child elements of currentPageContent
         const childElements = pageContainer.children;
         for (let i = 0; i < childElements.length; i++) {
          const childElement = childElements[i];
          // Calculate the height of the current child element and add it to currentHeight
          pageHeight += calculateDivHeight(childElement) + 10;
         }

         console.log("Table Parent Page Height: " + pageHeight);
         if ((pageHeight + addedHeight) > (maxHeight+padding)) {
             alert("Page Already Full");
             //textarea.value = textarea.value.slice(0, -1); // Remove the last character typed
             storeToArraySucceedingContent(parentContainer);
         }
        console.log("New is greater than old");
    } else {
//         console.log("revert?");
//         revertElementToPreviousPage(parentContainer);
    }

    textarea.style.height = 'auto'; // Reset the height to auto
    textarea.style.height = `${textarea.scrollHeight}px`; // Set the height to match the scroll height
}

function revertElementToPreviousPage(startingPoint) {
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


function initializeDraggables() {
    var tables = document.querySelectorAll('.table');
    var boxes = document.querySelectorAll('.box');
    var draggables = document.querySelectorAll('.draggable');

    // Element Initialization
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

    currentPageContent.addEventListener('click', (e) => {
        console.log("added listener to " + currentPageContent.id);
    	selectElement(currentPageContent);
    });


}

//jao's playgorund

function initializeHeightOfCurrentPage(currentPageValue){
    var receivedCurrentPage = "page-" + currentPageValue;
    var parentElement = document.getElementById(receivedCurrentPage);
    var children = parentElement.children;

    var currentPageHeight = 0;
    var countOfChildren = 0;
    for (var i = 0; i < children.length; i++) {
        countOfChildren = countOfChildren + 1;
        currentPageHeight = currentPageHeight + calculateDivHeight(children[i]);
    }

    initializeDraggables();

    currentHeight = currentPageHeight;
    currentPageContent = parentElement; // update pointer
    addEventListenerToDiv(currentPageContent);
    console.log(currentPageContent.id);
    console.log("Heigt of page: " + currentPageValue + " has a height of: " + currentPageHeight);
    console.log("Page: " + currentPageValue + " has " + countOfChildren + " children");
}

function initializeContextMenuForChildren(pageCount){
    var receivedCurrentPage = "";
    var parentElement;
    var children;

    for(i = 1; i <= pageCount; i++){
//        console.log("initializing for page " + i);
        receivedCurrentPage = "page-" + i;
        parentElement = document.getElementById(receivedCurrentPage);
        children = parentElement.children;

        for(j = 0; j < children.length; j++){
//            console.log(children[j]);
            initializeContextMenuForChild(children[j].firstElementChild);
        }
    }
}

function initializeContextMenuForChild(clonedDiv) {
//    console.log(clonedDiv);
//    console.log(clonedDiv.classList);

    function addContextMenuListenerToElement(clonedDiv) {
        clonedDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (clonedDiv.classList.contains("table")) {
                activateElement(clonedDiv, "table");
                createContextMenu(e.clientX, e.clientY, null, clonedDiv);
            } else {
                activateElement(clonedDiv, "div");
//                console.log(rightClickWidgetActive);
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
        processChildElements(child);
    }
    rightClickWidgetActive = true;
}




function initializeCurrentPage(){
    var pagesParent = document.getElementById("form-content");
    var pagesChildren = pagesParent.children;
    var countOfPages = 0;

    for (var i = 0; i < pagesChildren.length; i++) {
        countOfPages = countOfPages + 1;
    }

    currentPage = countOfPages;

    initializeHeightOfCurrentPage(currentPage);
    initializeContextMenuForChildren(currentPage);
//    console.log("number of pages: " + currentPage);
}


//end of jao's playgorund


// Page Settings
function setMaxHeight() {
    // Get all elements with the class "drop-container"
    var dropContainers = document.querySelectorAll('.drop-container');

    dropContainers.forEach(function (dropContainer) {
        const computedStyle = getComputedStyle(dropContainer);
        // Extract the padding value
        const paddingValue = computedStyle.getPropertyValue('padding');
//        console.log("padding value is: " + paddingValue);
        // Extract the numeric part of the padding value (removing 'px' or other units)
        padding = parseFloat(paddingValue);
        maxHeight = dropContainer.offsetHeight - padding;
    });
}

setMaxHeight();
//console.log("Max Height is: " + maxHeight);

function createNewPage() {
//    if (currentPageContent.querySelector("header-table")) {
//        updatePageNumbers();
//    }
	console.log("Successfully Created a New Page");
	currentPage++;
	console.log(currentPage);
	const newPage = document.createElement('div');
	//newPage.classList.add('drop-container', 'draggable'); // original line
	newPage.classList.add('drop-container'); // Add custom class names including 'draggable'
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

	//downloadPDF(newPage);
	addEventListenerToDiv(newPage);

    newPage.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/html', newPage.outerHTML);
        activeDraggable = newPage;
    });

    newPage.addEventListener('click', (e) => {
    	selectElement(newPage);
    });

    currentPageContent.style.pageBreakAfter = 'always'; // Add page break after the current page
    currentPageContent = newPage; // Create a new page
    currentHeight = 0 + header_height + padding; // Reset current height for the new page

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
				var textColor = "w3-text-" + selectedColor;
				span.className = "w3-text-" + selectedColor;
				span.textContent = selectedText;

				// Replace the selected text with the span
				const range = selection.getRangeAt(0);
//				range.deleteContents();
				range.classList.toggle(textColor);
//				range.insertNode(span);
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
//            console.log(currentSpan);

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
    orderedList.setAttribute("id", "selected");
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

    // Get all elements with the class "drop-container"
    var dropContainers = document.querySelectorAll('.drop-container');

    if (selectedValue === "landscape") {
        // Add the 'landscape' class to all drop containers
        dropContainers.forEach(function (dropContainer) {
            dropContainer.classList.add("landscape");
            setMaxHeight();
            console.log(maxHeight);
        });
    } else if (selectedValue === "portrait") {
        // Remove the 'landscape' class from all drop containers
        dropContainers.forEach(function (dropContainer) {
        dropContainer.classList.remove("landscape");
        setMaxHeight();
        });
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
	}
//	console.log(padding);
//	console.log(maxHeight);
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
    //            console.log(currentSpan);

                // There is no span element
                if (currentSpan == null) {
                    range.deleteContents();
                    range.insertNode(span);
                // The span exists but there is no bold style in the classlist
                } else if (currentSpan != null && !currentSpan.classList.contains("w3-underline")) {
                    currentSpan.classList.add('w3-underline');
                //
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
//        console.log(selectedText);
        if (selectedText) {
			// Create a new HTML structure with the selected text wrapped in a span
			const span = document.createElement("span");
			span.className = "w3-italic";
			span.textContent = selectedText;

			// Replace the selected text with the span
			const range = selection.getRangeAt(0);
			let currentSpan = checkForExistingTextSpan(range);
//			console.log(currentSpan);

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
//	console.log(currentNode);
	while (currentNode) {
		if (currentNode.nodeType === Node.ELEMENT_NODE && hasAnyClass(currentNode)) {
			return currentNode;
		}
		currentNode = currentNode.parentElement;
	}

	return null;
}

function makeInputUneditableOnDeployment() {
	if(selectedTextBox) {
		//selectedTextBox.classList.remove('uneditable');
		selectedTextBox.classList.add('w3-uneditable');
	}
}

function makeInputEditableOnDeployment() {
	if(selectedTextBox) {
		//selectedTextBox.classList.remove('uneditable');
		selectedTextBox.classList.remove('w3-uneditable');
	}
}

// Table Functions
function mergeCells(table) {
	const selectedCells = getSelectedCells(table);
//	console.log(selectedCells);
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

//	console.log('Same Row:', sameRow);
//	console.log('Same Column:', sameColumn);

	if (sameRow) {
		// If in the same row, set colspan to the number of selected cells
		colspan = selectedCells.length;
//		console.log('Colspan:', colspan);
	} else if (sameColumn) {
		// If in different rows, set rowspan to the number of selected cells
		rowspan = selectedCells.length;
//		console.log('Rowspan:', rowspan);
	} else {
	   // Calculate equivalent colspan and rowspan based on the positions of selected cells
		const firstRowIndex = firstCell.parentElement.rowIndex;
		const lastRowIndex = selectedCells[selectedCells.length - 1].parentElement.rowIndex;
		const firstCellIndex = firstCell.cellIndex;
		const lastCellIndex = selectedCells[selectedCells.length - 1].cellIndex;

		// Calculate colspan and rowspan based on cell positions
		colspan = lastCellIndex - firstCellIndex + 1;
		rowspan = lastRowIndex - firstRowIndex + 1;
//		console.log('Colspan:', colspan);
//		console.log('Rowspan:', rowspan);
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

//	console.log(cellIndex);

	const rowspan = parseInt(firstCell.getAttribute('rowspan')) || 1;
	const colspan = parseInt(firstCell.getAttribute('colspan')) || 1;

//	console.log(rowspan);
//	console.log(colspan);

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
//			console.log(i);
			const newRow = table.rows[rowIndex + i];
//			console.log("Row index: " + (rowIndex + i));
//			console.log(newRow);

			if (newRow) {

				for (let j = 0; j < colspan; j++) {
					const newCell = document.createElement('td');
					newCell.textContent = originalContent;

//				    console.log(table.rows[0].cells.length);
//				    console.log(newRow.cells.length);

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

function storeToArraySucceedingContent(startingPoint, maxHeight) {
    console.log("entered store to array");
    var allPages = document.querySelectorAll(".drop-container"); // Query all pages

    var sectionID = startingPoint.id; // Step 1
    var pageID = startingPoint.parentElement.id; // Step 2
    var startingPointPageChildren = Array.from(startingPoint.parentElement.children); // Section count page of element pointer

    var initialPageHeight = 0;
    var startingPointSectionID = parseInt(sectionID.match(/(\d+)$/)[1]); // section count of starting element
    var startingPointPageSuccChildren = []; // Succeeding children after element pointer
    var nextPageIndex = Array.from(allPages).findIndex(page => page.id === pageID) + 1;

    var lastChildIndex = startingPointPageChildren.length - 1;
    var lastChild = startingPointPageChildren[lastChildIndex];

    for (var i = startingPointPageChildren.length-1; i > 0; i--) {
        var currentElement = startingPointPageChildren[i];

        if (parseInt(currentElement.id.match(/(\d+)$/)[1]) > startingPointSectionID) {
            var currentDivHeight = calculateDivHeight(currentElement);

            if ((initialPageHeight + currentDivHeight) <= maxHeight) {
                initialPageHeight += currentDivHeight; // Step 4
            } else {
                console.log("Move " + currentElement.id + " to next page"); // Step 5
                var nextPage = allPages[nextPageIndex];

                if (nextPage === null) {
                    nextPage = createNewPage(); // Create a new page if nextPage is null
                    allPages = document.querySelectorAll(".drop-container"); // Update the list of pages
                }

//                nextPage.appendChild(currentElement); // Move current element to next page
                nextPage.insertBefore(lastChild, nextPage.children[1]); // Insert after the header
                startingPointPageSuccChildren.push(currentElement); // Step 3 for the next page
                nextPageIndex++;
                initialPageHeight = currentDivHeight; // Reset initial page height for the next page
            }
        } else {
            initialPageHeight += calculateDivHeight(currentElement); // Step 4
        }
    }


//
//                // Move the last child to the next page if there's enough space
//                if (nextPageIndex < allPages.length && lastChild !== startingPoint) {
//                    var nextPage = allPages[nextPageIndex];
//                    var nextPageHeader = nextPage.querySelector(".header"); // Assuming header has a class name "header"
//
//                    var lastChildHeight = calculateDivHeight(lastChild);
//                    var spaceNeeded = lastChildHeight; // Space needed to accommodate the last child
//
//                    // Check if there's enough space after the header for the last child
//                    if (nextPageHeader) {
//                        var headerHeight = calculateDivHeight(nextPageHeader);
//                        var remainingSpace = maxHeight - headerHeight;
//
//                        if (spaceNeeded <= remainingSpace) {
//                            nextPage.insertBefore(lastChild, nextPage.children[1])); // Insert after the header
//                            initialPageHeight += lastChildHeight;
//                        }
//                    }
//                }
    console.log(startingPointPageSuccChildren);
    console.log(initialPageHeight);
}


//    /**
//    Algorithm:
//    Step 1. Get the section ID of starting point element
//    Step 2. Get the page container or page ID of the starting point element
//    Step 3. Iterate through all the section in the extracted page ID div and push the sections after the section ID of starting point in an array (i.e. startingPointPageSuccChildren)
//    Step 4. Set the initial height of current page to sum the previous sections of the current page including the section at step 1.
//    Step 5. When initial page height plus the div height of any of the succeeding section children elements exceed maxHeight, push them as the first child of the next page
//    Step 6. Consequently, the section children of the succeeding pages will be updated accordingly.
//    */


function addTableRow(table) {
    var parentContainer = table.parentElement;
    var pageContainer = parentContainer.parentElement;

    console.log(pageContainer);

    var pageHeight = 0 + padding;

    // Iterate through all child elements of currentPageContent
    const childElements = pageContainer.children;
    for (let i = 0; i < childElements.length; i++) {
    	const childElement = childElements[i];
    	// Calculate the height of the current child element and add it to currentHeight
    	pageHeight += calculateDivHeight(childElement) + 10;
    }

    console.log("Table Parent Page Height: " + pageHeight);

    if ((pageHeight + 40) > (maxHeight+padding)) {
        alert("Page Already Full");
        storeToArraySucceedingContent(parentContainer);
        return;
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

	console.log(calculateDivHeight(newRow));

    currentHeight += 40;
	console.log("Updated Height: " + currentHeight);
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
    var deleteButtonSelected;
    var parentContainer = selectedTextBox.parentElement;
//    console.log("Parent Container ClassList: ");
//    console.log(parentContainer);


    if (rightClickWidgetActive) {
//        console.log("removed context listener");
        while (contextMenu.firstChild) {
            contextMenu.removeChild(contextMenu.firstChild);
        }
        rightClickWidgetActive = false;

    } else {
//        console.log("enabled context listener");
        contextMenu.classList.add('context-menu');

        if (table) {
//            console.log("Adding table functions");
            contextMenuButtonsForTable(table);
        }
        contextMenuButtonsForContainer(element);

        const deleteButton = document.createElement('button');
        deleteButton.classList.add("button-box");
        deleteButton.innerText = 'Delete Widget Field';
        deleteButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this box?')) {
                console.log(selectedTextBox);
                if (selectedTextBox.parentElement != null) {

                    if (selectedTextBox.nodeName === "TD" || selectedTextBox.nodeName === "TR") {
                        var parentNode = selectedTextBox.parentNode;
                        var tableContainer = parentNode.parentNode;

                        if (tableContainer.nodeName === "TBODY") {
                            var tableContainerOuter = tableContainer.parentElement;
                            tableContainerOuter.remove();
                            reassignSectionID();
                            var tableContainerSectionCover = tableContainerOuter;
                            console.log(tableContainerSectionCover);
                            console.log(tableContainerOuter.parentElement);
                        } else {
                            console.log(tableContainer);
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
                    console.log(currentHeight);
                    sectionCount -= 1;
                    currentHeight = updatePageHeight();
                    repositionBoxes();
                }


            }
        });

         contextMenu.appendChild(deleteButton);
                 if (isChild) {
                    contextMenu.appendChild(deleteButtonSelected);
                 isChild = false;
                 }


          const lockEditOnDeploy = document.createElement('button');
                    lockEditOnDeploy.classList.add("button-box");
                    lockEditOnDeploy.innerText = "Lock this field on deployment";

                    lockEditOnDeploy.addEventListener('click', () => {
                        if(confirm('Are you sure you want to lock this editable field on deployment?')) {
                            makeInputUneditableOnDeployment();
                        }
                        contextMenu.remove();
                    })

                    const unlockEditOnDeploy = document.createElement('button');
                    unlockEditOnDeploy.classList.add("button-box");
                    unlockEditOnDeploy.innerText = "Unlock this field on deployment";

                    unlockEditOnDeploy.addEventListener('click', () => {
                        if(confirm('Are you sure you want to unlock this editable field on deployment?')) {
                            makeInputEditableOnDeployment();
                        }
                        contextMenu.remove();
                    })

        contextMenu.appendChild(lockEditOnDeploy);
        contextMenu.appendChild(unlockEditOnDeploy);

//        console.log(contextMenu.childElementCount);

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
//                console.log(element);
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
    const addRowButton = document.createElement('button');
    addRowButton.classList.add("button-table");
    addRowButton.innerText = 'Add Row';

    addRowButton.addEventListener('click', () => {
     addTableRow(table);
     contextMenu.remove();
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

function restrictCheckBoxSelection() {
    const checkboxes = currentPageContent.querySelectorAll('input[name="academicStatus"]');
//    console.log(checkboxes);
        console
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

//restrictCheckBoxSelection();

function dropContent(boxHeight, data) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = data;

    //jaos playground
    tempDiv.classList.add('hover');
    //end of playground

    const newDiv = tempDiv.querySelector('.draggable');

    if (newDiv) {
        var clonedDiv = newDiv.cloneNode(true);
        clonedDiv.removeAttribute("draggable");

        initializeContextMenuForChild(clonedDiv);
        clonedDiv = selectElement(clonedDiv);
        clonedDiv = removeReadOnlyAttributesRecursive(clonedDiv);

        if (currentPageContent) { // Check if currentPageContent is defined
            sectionCount += 1;
            const sectionDiv = document.createElement('div');
            sectionDiv.id = "section-" + currentPage + "-" + sectionCount;
            sectionDiv.appendChild(clonedDiv);

            if ((currentHeight + boxHeight) > (maxHeight+padding)) {
                createNewPage();
            }

            if (clonedDiv.nodeName === "TEXTAREA") {
                console.log("Is a textarea");
                var addHeight = 0;
                clonedDiv.addEventListener('keydown', () => {
                    adjustTextareaHeight(clonedDiv);
                });
                console.log(currentHeight);
            }

            currentPageContent.appendChild(sectionDiv); // Append to the current page's content

            currentHeight += calculateDivHeight(clonedDiv);
            console.log("Updated Height: " + currentHeight);


        }

        // Update page numbers
        if (currentPageContent.querySelector("header-table")) {
            updatePageNumbers();
        }

    } else {
        console.error('currentPageContent is undefined.'); // Log an error if currentPageContent is undefined
    }


//    console.log("entered drop content function");
//    const sectionDiv = document.createElement('div');
//    sectionDiv.id = "section-" + sectionCount;
//    sectionDiv.appendChild(myDiv);
//    currentPageContent.appendChild(sectionDiv); // Append to the current page's content
}
//}

function getCurrentHeight() {
return currentHeight;
}

function saveIntoPages() {
    var longDivContent = currentPageContent;



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
//	console.log("Current Page Height is: " + tempHeight);
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
    console.log(numberOfChildren);
//    console.log(currentPageContent.id);

    // Do nothing if current page is the first page
    if (currentPageContent.id != "page-1") {
        if (numberOfChildren <= 1) {
			var prevpage = currentPage - 1;
			var pageIDString = "page-" + prevpage;
			let dropContainers = document.querySelectorAll('.drop-container');
			let found = false;
//			console.log(dropContainers);

			dropContainers.forEach(dropContainer => {
//				console.log(dropContainer.id);
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
//   console.log(currentPageContent.id);
//   console.log(currentPage);
   currentHeight = updatePageHeight;
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
        console.log(currentPageContent.id);
        e.preventDefault();
        setMaxHeight();
        console.log("New max height is: " + maxHeight);
        dropBox.classList.remove('hover');
        console.log(activeDraggable);
        if (activeDraggable) {
            const boxHeight = calculateDivHeight(activeDraggable);
            if (isFirstElement == true) {
                header_height = boxHeight;
                isFirstElement = false;
            }

            console.log(header_height);
            console.log(currentHeight + " is the current height");
            console.log(boxHeight + " is the new element height");
            console.log(currentHeight + boxHeight + "px");

            const data = e.dataTransfer.getData('text/html');
            dropContent(boxHeight, data);
            activeDraggable = null;
        }
    });
}

function removeReadOnlyAttributesRecursive(element) {
  if (element instanceof HTMLElement) {
    // Check if the element has a readonly attribute
    if (element.hasAttribute('readonly')) {
      element.removeAttribute('readonly');
    }

     // Set contentEditable attribute to true
     element.setAttribute('contentEditable', 'true');

    // Iterate through child elements
    const childElements = element.children;
    for (let i = 0; i < childElements.length; i++) {
      removeReadOnlyAttributesRecursive(childElements[i]);

    }
  }
  return element;
}

function activateElement(clonedDiv, elementType) {
    if (elementType === "div") {
//        // Make all children of the div editable
//        const children = clonedDiv.children;
//        for (let i = 0; i < children.length; i++) {
//            const child = children[i];
//            child.addEventListener('click', () => {
//                if (child.classList.contains('selected')) {
//                    child.classList.remove('selected');
//                } else {
//                    child.id = 'selected';
//                    child.setAttribute('contenteditable', 'true');
//                }
//            });
//        }
    } else if (elementType === "table") {
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
                    cell.classList.add('selectedCells');
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
    }
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
	    if (selectedTextBox && selectedTextBox.getAttribute('id') === "selected") {
//	        console.log("sel check");
            // Check if the "id" attribute matches the selectedElement
	        selectedTextBox.removeAttribute('contentEditable');
        } else if (selectedTextBox && element.classList.contains("drop-container")) {
          selectedTextBox.removeAttribute('contentEditable');
           var pageID = 'page-' + currentPage;
           selectedTextBox.setAttribute('id', pageID);
        } else if (selectedTextBox) {
            selectedTextBox.removeAttribute('contentEditable');
        }

        if (clickedElement.classList.contains("drop-container")) {
            console.log("changed current page");
            console.log(element);
            currentPageContent = element;
        }

		// Select the clicked element
		clickedElement.setAttribute('contentEditable', 'true');
		clickedElement.id = 'selectedElement';
		selectedTextBox = clickedElement;

//        console.log(selectedTextBox);


		// Ensure the clicked element is editable
		clickedElement.removeAttribute('readonly');
	});
//    console.log(element);
    return element;
}

/*
His palms are sweaty, knees weak, arms are heavy
There's vomit on his sweater already, mom's spaghetti
He's nervous, but on the surface, he looks calm and ready
To drop bombs, but he keeps on forgetting
What he wrote down, the whole crowd goes so loud
He opens his mouth, but the words won't come out
He's chokin', how? Everybody's jokin' now
The clock's run out, time's up, over, blaow
Snap back to reality, ope, there goes gravity
Ope, there goes Rabbit, he choked, he's so mad
But he won't give up that easy, no, he won't have it
He knows his whole back's to these ropes, it don't matter
He's dope, he knows that, but he's broke, he's so stagnant
He knows when he goes back to this mobile home, that's when it's
Back to the lab again, yo, this old rhapsody
Better go capture this moment and hope it don't pass him
*/
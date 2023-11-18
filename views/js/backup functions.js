    // Keep track of the currently hovered text box
  let selectedTextBox = null;
    // Keep track of the currently hovered text box
   let hoveredTextBox = null;

const selectedElement = document.getElementById("selected");

selectedElement.addEventListener("keydown", function (event) {
    // Check if the pressed key is Enter (key code 13)
    if (event.keyCode === 13) {
        // Prevent the default Enter behavior (line break)
        event.preventDefault();

        // Insert a <br> tag at the current cursor position
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const brElement = document.createElement("br");
        range.insertNode(brElement);

        // Move the cursor after the inserted <br> tag
        range.setStartAfter(brElement);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    }
});

   /* Set the width of the sidebar to 250px and the left margin of the page content to 250px */
   function openNavigation() {
       // Get the element by its ID
       const sidebar = document.getElementById("mySidebar");
       const main = document.getElementById("main");
       // Toggle the classes for showing/hiding the sidebar
       sidebar.classList.toggle("w3-show");
       // Toggle the margin of the main content
       main.style.marginLeft = "250px";
   }

   /* Set the width of the sidebar to 0 and the left margin of the page content to 0 */
   function closeNav() {
       document.getElementById("mySidebar").style.width = "0";
       document.getElementById("main").style.marginLeft = "0";
   }

   function createTextBox() {
     let selectedTextBoxType = null ;
     const select = document.getElementById("textBoxSelect");
     const selectedValue = select.value;

     if (selectedValue === "title") {
       const div = document.createElement("div");
       div.className = "title";
       div.setAttribute('contenteditable', 'true');
       div.textContent = "This is a title.";
       selectedTextBoxType = div;

     } else if (selectedValue === "normal-text") {
       const p = document.createElement("p");
       p.className = "paragraph";
       p.setAttribute('contenteditable', 'true');
       p.textContent = "This is a paragraph.";
       selectedTextBoxType = p;

     } else if (selectedValue === "subtitle") {
       const div = document.createElement("div");
       div.className = "subtitle";
       div.setAttribute('contenteditable', 'true');
       div.textContent = "This is a subtitle.";
       selectedTextBoxType = div;

     } else if (selectedValue === "heading-1") {
       const heading = document.createElement("h1");
       heading.className = "heading-1";
       heading.setAttribute('contenteditable', 'true');
       heading.textContent = "This is heading 1.";
       selectedTextBoxType = heading;

     } else if (selectedValue === "heading-2") {
       const heading = document.createElement("h2");
       heading.className = "heading-2";
       heading.setAttribute('contenteditable', 'true');
       heading.textContent = "This is heading 2.";
       selectedTextBoxType = heading;

     } else if (selectedValue === "heading-3") {
       const heading = document.createElement("h3");
       heading.className = "heading-3";
       heading.setAttribute('contenteditable', 'true');
       heading.textContent = "This is heading 3.";
       selectedTextBoxType = heading;
     }

      const container = document.getElementById("page-1");
      selectedTextBoxType.classList.add("element-spacing-5");
       // Add click event listener to toggle selection
      selectedTextBoxType.addEventListener('click', function () {

            // Unselect the previously selected text box, if any
            if (selectedTextBox) {
                selectedTextBox.style.border = '1px solid #ccc3'; // Optional: Visual indicator
                selectedTextBox.removeAttribute('id'); // Remove the "id" attribute


            }
            // Select the current text box

            selectedTextBoxType.setAttribute('contentEditable', 'true');
            selectedTextBoxType.style.border = '2px solid blue'; // Optional: Visual indicator
            selectedTextBoxType.id = 'selected'; // Add the "id" attribute
            selectedTextBox =  selectedTextBoxType;



            // Ensure the text box is editable
            selectedTextBoxType.removeAttribute('readonly'); // Remove readonly attribute
        });
       container.appendChild(selectedTextBoxType);
   }

    function createTable() {
      const tableContainer = document.getElementById("page-1");
      const table = document.createElement("table");
      const tableBody = document.createElement("tbody");

      // Create table header row
      const headerRow = document.createElement("tr");
      const headerCell1 = document.createElement("th");
      headerCell1.textContent = "Header 1";
      const headerCell2 = document.createElement("th");
      headerCell2.textContent = "Header 2";
      headerRow.appendChild(headerCell1);
      headerRow.appendChild(headerCell2);

      // Create table data rows
      for (let i = 1; i <= 3; i++) {
        const row = document.createElement("tr");
        const cell1 = document.createElement("td");
        cell1.setAttribute('contenteditable', 'true');
        //cell1.textContent = "Row " + i + ", Cell 1";
        const cell2 = document.createElement("td");
        //cell2.textContent = "Row " + i + ", Cell 2";
        row.appendChild(cell1);
        row.appendChild(cell2);
        tableBody.appendChild(row);
      }

      table.appendChild(headerRow);
      table.appendChild(tableBody);
      tableContainer.appendChild(table);
    }

   function changeTextColor() {
    if (selectedTextBox) {
        const selectedTextDisplay = document.getElementById("selectedTextDisplay");

        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText) {
            // Get the selected color from the dropdown
            const colorSelect = document.getElementById("colorSelect");
            const selectedColor = colorSelect.value;

            // Create a new HTML structure with the selected text wrapped in a span with the new color class
            const span = document.createElement("span");
            span.className = "w3-text-" + selectedColor;
            span.textContent = selectedText;

            // Replace the selected text with the span
            const range = selection.getRangeAt(0);
            let currentSpan = checkForExistingTextSpan(range);

            if (currentSpan != null) {
                // Check if the current span already has a color class
                const currentColorClass = Array.from(currentSpan.classList).find(cls => cls.startsWith("w3-text-"));
                if (currentColorClass) {
                    // Remove the current color class
                    currentSpan.classList.remove(currentColorClass);
                }
                // Add the new color class
                currentSpan.classList.add("w3-text-" + selectedColor);
            } else {
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

            if (currentSpan != null) {
                currentSpan.classList.add('w3-bold');
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

            if (currentSpan != null) {
                currentSpan.classList.add('w3-underline');
            } else {
                range.deleteContents();
                range.insertNode(span);
                  selection.removeAllRanges(); // Clear the selection
            }
        }
    }
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
            if (currentSpan != null) {
                console.log("add");
                currentSpan.classList.add('w3-italic');
            } else {
                console.log("new");
                range.deleteContents();
                range.insertNode(span);
                  selection.removeAllRanges(); // Clear the selection
            }

        }
    }
}


function checkForExistingTextSpan(range) {

    const container = range.commonAncestorContainer;
    // Define an array of class names to check
    const classNames = ['w3-bold', 'w3-italic', 'w3-underline', 'w3-left-align', 'w3-right-align', 'w3-center', 'w3-justify',
    'w3-text-red', 'w3-text-blue', 'w3-text-grey', 'w3-text-white', 'w3-text-black'];

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


// Backup
function createTextBox() {
     const select = document.getElementById("textBoxSelect");
     select.className = "textbox";
     const selectedValue = select.value;
     var selectedTextBoxType = null;

     if (selectedValue === "title") {
       const div = document.createElement("h3");
       div.className = "textbox";
       div.setAttribute('contenteditable', 'true');
       div.textContent = "This is a title.";
       selectedTextBoxType = div;

     } else if (selectedValue === "normal-text") {
       const heading = document.createElement("h5");
       heading.className = "textbox";
       heading.setAttribute('contenteditable', 'true');
       heading.textContent = "This is a paragraph.";
       selectedTextBoxType = heading;

     } else if (selectedValue === "paragraph") {
       const p = document.createElement("p");
       p.className = "textbox";
       p.setAttribute('contenteditable', 'true');
       p.textContent = "This is a subtitle.";
       selectedTextBoxType = p;

     }

     console.log(selectedTextBoxType);

      selectedTextBoxType.classList.add("element-spacing-5");

      // Add click event listener to toggle selection
      selectedTextBoxType = selectElement(selectedTextBoxType);

      currentPageContent.appendChild(selectedTextBoxType);
   }


       function createTable() {
         const table = document.createElement("table");
         const tableBody = document.createElement("tbody");

         // Create table header row
         const headerRow = document.createElement("tr");
         const headerCell1 = document.createElement("th");
         headerCell1.textContent = "Header 1";
         const headerCell2 = document.createElement("th");
         headerCell2.textContent = "Header 2";
         headerRow.appendChild(headerCell1);
         headerRow.appendChild(headerCell2);

         // Create table data rows
         for (let i = 1; i <= 3; i++) {
           const row = document.createElement("tr");
           let cell1 = document.createElement("td");
           cell1 = selectElement(cell1);
           cell1.setAttribute('contenteditable', 'true');
           let cell2 = document.createElement("td");
           cell2 = selectElement(cell2);

           row.appendChild(cell1);
           row.appendChild(cell2);
           tableBody.appendChild(row);
         }

         table.classList.add("table");
         table.setAttribute('contenteditable', 'true');
         table.appendChild(headerRow);
         table.appendChild(tableBody);
         currentPageContent.appendChild(table);
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
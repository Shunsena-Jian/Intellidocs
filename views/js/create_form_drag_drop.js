const draggable = document.querySelectorAll('.draggable');
const dropBox = document.querySelector('.drop-container');
let activeDraggable = null;
var i = 1;
let currentPage = 1;
let currentHeight = 0;
var maxHeight = 1020; // A4 height in pixels
let currentPageContent = document.querySelector('.drop-container'); // Reference to the current page's content
const containerDiv = document.getElementById('outer-container');
let isSelecting = false;
let startCell = null;
padding = 36;

header_height = 0;

const tables = document.querySelectorAll('.table');

    // Keep track of the currently hovered text box
  let selectedTextBox = null;

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

tables.forEach((table) => {
    let selectedCells = [];

    table.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/html', table.outerHTML);
                activeDraggable = table;
            });
    });


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

function createContextMenuBox(x,y,element) {
    const contextMenu = document.createElement('div');
    contextMenu.classList.add('context-menu');

    if (element.classList.contains('draggable')) {
            const deleteButton = document.createElement('button');
            deleteButton.innerText = 'Delete Widget Field';
            deleteButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this box?')) {
                    element.remove();
                    repositionBoxes();
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

}

function createContextMenuTable(x, y, element) {
    const contextMenu = document.createElement('div');
    contextMenu.classList.add('context-menu');
    if (element.classList.contains('draggable')) {
            const deleteButton = document.createElement('button');
            deleteButton.innerText = 'Delete Widget Table';
            deleteButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this box?')) {
                    element.remove();
                    checkCurrentPage();
                    repositionBoxes();
//                    checkCurrentPage();
                }
                contextMenu.remove();
            });

            contextMenu.appendChild(deleteButton);

        }

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

function checkCurrentPage() {
    var numberOfChildren = currentPageContent.childElementCount;
   console.log(numberOfChildren);

   // Do nothing if current page is the first page
   if (currentPage != 1) {
        if (numberOfChildren == 1) {
            currentPage -= 1;
            var pageIDString = "page-" + currentPage;
            let dropContainers = document.querySelectorAll('.drop-container');
            let found = false;

            dropContainers.forEach(dropContainer => {
                if (dropContainer.id === pageIDString) {
                    currentPageContent = dropContainer;
                    return;
                }
            });

        }
   }
   console.log(currentPageContent.id);
   console.log(currentPage);
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


function calculateDivHeight(element) {
    const styles = getComputedStyle(element);
    const marginTop = parseFloat(styles.marginTop);
    const marginBottom = parseFloat(styles.marginBottom);
    const paddingTop = parseFloat(styles.paddingTop);
    const paddingBottom = parseFloat(styles.paddingBottom);
    const borderHeight = parseFloat(styles.borderTopWidth) + parseFloat(styles.borderBottomWidth);



        // Check if the element is a table
            if (element.tagName.toLowerCase() === 'table') {
                // Calculate the height differently for tables
                const rows = element.rows;
                let tableHeight = element.offsetHeight;

//                // Calculate the height by summing the height of each row
//                for (let i = 0; i < rows.length; i++) {
//                    tableHeight += rows[i].offsetHeight;
//                }

                // Add margins, padding, and borders
                tableHeight = tableHeight + marginBottom + marginTop;
                console.log("table");
                return tableHeight;
            } else {
                // Calculate the height for non-table elements
//                const height = element.offsetHeight - marginBottom - paddingBottom - paddingTop - borderHeight -  (padding);
                const height = element.offsetHeight + marginBottom + marginTop;
                console.log("div");
                return height;
            }


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
        const previousPage = document.querySelector(`#page-${currentPage - 1}`);
        const headerDiv = previousPage.querySelector('.header');
        if (headerDiv) {
            const headerClone = headerDiv.cloneNode(true);
            newPage.appendChild(headerClone);
        }
    }

    //downloadPDF(newPage);
    addEventListenerToDiv(newPage);
    currentPage +=1;
    return newPage;
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
        if (i === 1) {
            header_height = boxHeight;
            i = -1;
            console.log(header_height);
        }
        console.log(currentHeight + " is the current height");
        console.log(boxHeight + " is the new element height");
        console.log(currentHeight + boxHeight + "px");
        if (currentHeight + boxHeight > (maxHeight + padding)) {
            currentPageContent.style.pageBreakAfter = 'always'; // Add page break after the current page
            currentPageContent = createNewPage(); // Create a new page
            currentHeight = 0 + header_height + padding; // Reset current height for the new page
        }

        const data = e.dataTransfer.getData('text/html');
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

                        } else if (clonedDiv.nodeName.toLowerCase() === 'div' && clonedDiv.querySelector('table')) {
                            // Check if it is a div and has a table child element. If yes, apply
                            const tableChild = clonedDiv.querySelector('table');
                            var updatedTableChild = activateTable(tableChild);

                            updatedTableChild.addEventListener('contextmenu', (e) => {
                                      e.preventDefault();
                                      createContextMenuTable(e.clientX, e.clientY, updatedTableChild);
                                  });

                            // Update the tableChild in the clonedDiv after
                            const oldTableChild = clonedDiv.querySelector('table');

                            const parentDiv = oldTableChild.parentNode;
                            parentDiv.replaceChild(updatedTableChild, oldTableChild);

                            clonedDiv.addEventListener('contextmenu', (e) => {
                                e.preventDefault();
                                createContextMenuBox(e.clientX, e.clientY, clonedDiv);
                            });
                        } else {
                            console.log(clonedDiv);
                            clonedDiv.addEventListener('contextmenu', (e) => {
                            e.preventDefault();
                            createContextMenuBox(e.clientX, e.clientY, clonedDiv);
                        });
                        }

            clonedDiv = selectElement(clonedDiv);
            if (currentPageContent) { // Check if currentPageContent is defined
                currentPageContent.appendChild(clonedDiv); // Append to the current page's content
                currentHeight += boxHeight; // Update the current height
                console.log(currentHeight);
                // Update page numbers
                updatePageNumbers();
            } else {
                console.error('currentPageContent is undefined.'); // Log an error if currentPageContent is undefined
            }
        }
        activeDraggable = null;
    }
});
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
   element.addEventListener('click', function () {

               // Unselect the previously selected text box, if any
               if (selectedTextBox) {
                   selectedTextBox.removeAttribute('id'); // Remove the "id" attribute


               }
               // Select the current text box
               element.setAttribute('contentEditable', 'true');
               element.id = 'selected'; // Add the "id" attribute
               selectedTextBox =  element;

               // Ensure the text box is editable
               element.removeAttribute('readonly'); // Remove readonly attribute
           });

           console.log(element);
           // Add the context menu event listener to it
                       element.addEventListener('contextmenu', (e) => {
                             e.preventDefault();
                             console.log("Fired!!!!");
                             createContextMenuBox(e.clientX, e.clientY, element);
                       });
   return element;
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

      // Get all elements with the class "drop-container"
      var dropContainers = document.querySelectorAll('.drop-container');

     if (selectedValue === "landscape") {
            // Add the 'landscape' class to all drop containers
            dropContainers.forEach(function (dropContainer) {
                dropContainer.classList.add("landscape");
            });
        } else if (selectedValue === "portrait") {
            // Remove the 'landscape' class from all drop containers
            dropContainers.forEach(function (dropContainer) {
                dropContainer.classList.remove("landscape");
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
    console.log(padding);
    console.log(maxHeight);
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

// DO NOT TOUCH THIS, OR EVERYTHING WILL CRUMBLE
addEventListenerToDiv(dropBox);


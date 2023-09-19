const draggable = document.querySelectorAll('.draggable');
const dropBox = document.querySelector('.drop-container');
let activeDraggable = null;

let currentPage = 1;
let currentHeight = 0;
const maxHeight = 840; // A4 height in pixels
let currentPageContent = document.querySelector('.drop-container'); // Reference to the current page's content
const containerDiv = document.getElementById('outer-container');
let isSelecting = false;
let startCell = null;

const tables = document.querySelectorAll('.table');

tables.forEach((table) => {
    let selectedCells = [];

    table.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/html', table.outerHTML);
                activeDraggable = table;
            });
    });


function mergeCells(table) {
const selectedCells = getSelectedCells(table);
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

    if (sameRow) {
        // If in the same row, set colspan to the number of selected cells
        colspan = selectedCells.length;
    } else {
        // If in different rows, set rowspan to the number of selected cells
        rowspan = selectedCells.length;
    }

        // Set rowspan and colspan for the first cell
        firstCell.textContent = mergedContent;
        firstCell.setAttribute('rowspan', rowspan);
        firstCell.setAttribute('colspan', colspan);

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

        // Iterate to restore original content and appearance for each cell
        for (let i = 0; i < rowspan; i++) {
            const newRow = table.rows[rowIndex+i];

            if (newRow) {
                 let colOrRow = null;
                 let newCellCount = newRow.cells.length;
                if (colspan > 1) {
                 newCellCount = newRow.cells.length + (colspan-1) ;
                 colOrRow = 'col';
                }

                console.log(newCellCount);
                if (colOrRow === 'col') {
                    if (newCellCount > newRow.cells.length) {
                          // Add <td> elements to match the new column count
                          for (let i = newRow.cells.length; i < newCellCount; i++) {
                          const cell = document.createElement('td');
                          newRow.appendChild(cell);
                          }
                    }
                }

                if (newCellCount > newRow.cells.length) {
                    // Add <td> elements to match the new column count
                      for (let i = newRow.cells.length; i < newCellCount; i++) {
                        const cell = document.createElement('td');
                        newRow.appendChild(cell);
                      }
                }
                for (let j = 0; j < newCellCount; j++) {
                    console.log(j);
                    const existingCell = newRow.cells[cellIndex + j];
                    if (existingCell) {
                        existingCell.textContent = originalContent;
                        existingCell.classList.remove('merged');
                    }
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

function createContextMenu(x, y, element) {
    const contextMenu = document.createElement('div');
    contextMenu.classList.add('context-menu');

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

    if (element.classList.contains('resizable')) {
        const increaseHeightButton = document.createElement('button');
        increaseHeightButton.innerText = 'Increase Height';
        increaseHeightButton.addEventListener('click', () => {
            resizeBoxHeight(element, 10); // Increase the height by 10 pixels (adjust as needed)
            contextMenu.remove();
        });

        const decreaseHeightButton = document.createElement('button');
        decreaseHeightButton.innerText = 'Decrease Height';
        decreaseHeightButton.addEventListener('click', () => {
            resizeBoxHeight(element, -10); // Decrease the height by 10 pixels (adjust as needed)
            contextMenu.remove();
        });

        contextMenu.appendChild(increaseHeightButton);
        contextMenu.appendChild(decreaseHeightButton);
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


function calculateDivHeight(div) {
    const styles = getComputedStyle(div);
    //const marginTop = parseFloat(styles.marginTop);
    //const marginBottom = parseFloat(styles.marginBottom);
    const paddingTop = parseFloat(styles.paddingTop);
    const paddingBottom = parseFloat(styles.paddingBottom);
    const borderHeight = parseFloat(styles.borderTopWidth) + parseFloat(styles.borderBottomWidth);
//    const height = div.offsetHeight + marginTop + marginBottom + paddingTop + paddingBottom + borderHeight;
    const height = div.offsetHeight + paddingTop + paddingBottom + borderHeight;
    return height;
}

function createNewPage() {
    currentHeight = 0;
    currentPage++;

    const newPage = document.createElement('div');
    newPage.classList.add('drop-container', 'draggable'); // Add custom class names including 'draggable'
    newPage.setAttribute('id', `page-${currentPage}`); // Give the page a unique ID

    const containerDiv = document.querySelector('.pages');
    containerDiv.appendChild(newPage); // Append the new page to the container div
    downloadPDF(newPage);
    addEventListenerToDiv(newPage);

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
    dropBox.classList.remove('hover');

    if (activeDraggable) {
        const boxHeight = calculateDivHeight(activeDraggable);
        console.log();
        console.log(currentHeight + boxHeight + "px");
        if (currentHeight + boxHeight > maxHeight) {
            currentPageContent.style.pageBreakAfter = 'always'; // Add page break after the current page
            currentPageContent = createNewPage(); // Create a new page
            currentHeight = 0; // Reset current height for the new page
        }

        const data = e.dataTransfer.getData('text/html');
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = data;

        const newDiv = tempDiv.querySelector('.draggable');

        if (newDiv) {
            const clonedDiv = newDiv.cloneNode(true);
            clonedDiv.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                createContextMenu(e.clientX, e.clientY, clonedDiv);
            });

            // Add the non-draggable class
             clonedDiv.removeAttribute("draggable");

            // Check if the clonedDiv is a table
            console.log(clonedDiv.classList);
            // Check if the clonedDiv is a table or contains tables within divs
                        if (clonedDiv.nodeName.toLowerCase() === 'table') {

                            if (clonedDiv.id === "table_header") {
                              // Add CSS styles to the table
                                clonedDiv.classList.add("right");
                            }
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
                        } else if (clonedDiv.nodeName.toLowerCase() === 'div') {

                        }

            if (currentPageContent) { // Check if currentPageContent is defined
                currentPageContent.appendChild(clonedDiv); // Append to the current page's content
                currentHeight += boxHeight; // Update the current height
                console.log(currentHeight);
            } else {
                console.error('currentPageContent is undefined.'); // Log an error if currentPageContent is undefined
            }
        }

        activeDraggable = null;
    }
});
}

function resizeBoxHeight(box, deltaHeight) {
    const currentHeight = calculateDivHeight(box);
    const newHeight = currentHeight + deltaHeight;

    if (newHeight >= 0) {
        box.style.height = newHeight + 'px';

        // Adjust the content inside the box
        const content = box.querySelector('.draggable-content');
        if (content) {
            content.style.height = (newHeight - 10 ) + 'px';
        }
    }
}

// DO NOT TOUCH THIS, OR EVERYTHING WILL CRUMBLE
addEventListenerToDiv(dropBox);


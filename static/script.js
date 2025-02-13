document.addEventListener("DOMContentLoaded", function() {

    // Global Variables and Constants
    // ============================================================
    let gridSize = null;         // Will hold the current grid dimensions (rows and columns)
    let boxes = [];              // Array to store created boxes on the grid
    let isLocked = false;        // Flag used for locking box movement if needed
    let selectedBox = null;      // The currently selected (clicked) box
    const boxLabels = ['A', 'B', 'C'];  // Labels for boxes in order of creation
    // Define a list of colors to use for boxes
    const boxColors = [
        "rgba(255, 0, 0, 0.5)",    // semi-transparent red
        "rgba(255, 165, 0, 0.5)",  // semi-transparent orange
        "rgba(255, 255, 0, 0.5)",  // semi-transparent yellow
        "rgba(0, 0, 255, 0.5)",    // semi-transparent blue
        "rgba(128, 0, 128, 0.5)"   // semi-transparent purple
    ];
    let colorIndex = 0;          // Global counter for cycling through boxColors
    const cellSize = 50;        // Each grid cell is 50x50 pixels

    // Helper Functions

    let savedRange = null;       // Global variable to store the current selection

    function saveSelection() {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            savedRange = sel.getRangeAt(0);
        }
    }
    function restoreSelection() {
        if (savedRange) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedRange);
        }
    }
    // Attach events to save the caret position on mouseup and keyup
    const eqInput = document.getElementById("equation-input");
    const maxChars = 15;
    eqInput.addEventListener("mouseup", saveSelection);
    eqInput.addEventListener("keyup", saveSelection);

    document.getElementById("equation-bar").addEventListener("click", function() { //Focus the attention on the equation bar when clicked
        document.getElementById("equation-input").focus();
      });


    // Insert text at the current caret (restores saved selection first)
    function insertTextAtCursor(text) {
        const eqInput = document.getElementById("equation-input");
        // Calculate how many characters we can still insert.
        const remaining = maxChars - eqInput.textContent.length;
        if (remaining <= 0) {
          return; // Hard cap reached; do nothing.
        }
        // If the new text is longer than allowed, trim it.
        const textToInsert = text.substring(0, remaining);
      
        restoreSelection();
        const sel = window.getSelection();
        if (sel.rangeCount) {
          let range = sel.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(textToInsert);
          range.insertNode(textNode);
          // Move caret after inserted text.
          range.setStartAfter(textNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
          savedRange = range; // update savedRange
        }
      }
      
    // Ensure handleEquationButton is attached to the global window:
window.handleEquationButton = function(value, event) {
    event.preventDefault();  // Prevent focus from being stolen
    const eqInput = document.getElementById("equation-input");
    eqInput.focus();
    // If no saved selection, create one at the end of eqInput.
    if (!savedRange) {
        let range = document.createRange();
        range.selectNodeContents(eqInput);
        range.collapse(false);
        savedRange = range;
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
    // Use a timeout to insert after any blur events settle
    setTimeout(function() {
        insertTextAtCursor(value);
    }, 0);
};

// Attach event listeners to all buttons with class "eq-button"
document.querySelectorAll(".eq-button").forEach(function(button) {
    button.addEventListener("mousedown", function(event) {
        // We can get the value from the data attribute
        const value = button.getAttribute("data-value");
        handleEquationButton(value, event);
    });
});



// Prevent Enter key (we already have this, but keep it here for completeness)
eqInput.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
  }

  // Allow control keys (backspace, delete, arrows, etc.)
  const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Tab", "Control", "Alt", "Meta", "Shift"];

  // If the current text is at or above max and the pressed key is not allowed, prevent input.
  if (this.textContent.length >= maxChars && !allowedKeys.includes(event.key)) {
    event.preventDefault();
  }
});

// Also handle pasted text: trim the content if it exceeds the limit.
eqInput.addEventListener("input", function(event) {
  if (this.textContent.length > maxChars) {
    this.textContent = this.textContent.substring(0, maxChars);

    // Optionally, reposition the caret to the end:
    let range = document.createRange();
    range.selectNodeContents(this);
    range.collapse(false);
    let sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    // Update savedRange if you're using selection-saving logic.
    savedRange = range;
  }
});



    // getRandomColor() cycles through the defined colors (instead of "running out")
    function getRandomColor() {
        // Get the color at the current index.
        let selectedColor = boxColors[colorIndex];
        // Increment the index and loop back to 0 if at the end.
        colorIndex = (colorIndex + 1) % boxColors.length;
        return selectedColor;
    }

    // Generate grid function creates the grid based on user input (format "rows x cols")
    // Also clears any existing grid content and boxes if needed.

    window.generateGrid = function() {
        const gridInput = document.getElementById("grid-size").value;
        const gridContainer = document.getElementById("grid");
        gridContainer.style.position = "relative";
        gridContainer.innerHTML = "";  // Clear any previous grid cells

        // Split the input ("4x4") into rows and columns.
        const [rows, cols] = gridInput.split("x").map(Number);
        if (!rows || !cols) {
            alert("Please enter a valid grid size (e.g., 4x4)");
            return;
        }

        // Maximum grid size of 15x15.
        if (rows > 15 || cols > 15) {
            alert("Maximum grid size is 15x15");
            return;
        }

        // If boxes are already present, clear the grid (restart program).
        if (boxes.length > 0) {
            restartProgram();  // This clears boxes, highlights, and resets the equation bar.
        }

        gridSize = { rows, cols };

        gridContainer.style.cssText =
            "position: relative;" +
            "width: " + (cols * cellSize) + "px;" +
            "height: " + (rows * cellSize) + "px;" +
            "display: grid;" +
            "grid-template-columns: repeat(" + cols + ", " + cellSize + "px);" +
            "grid-template-rows: repeat(" + rows + ", " + cellSize + "px);" +
            "border: 2px solid black;" +
            "margin: 20px auto;";

console.log("grid-template-columns:", gridContainer.style.getPropertyValue("grid-template-columns"));
    console.log("grid-template-rows:", gridContainer.style.getPropertyValue("grid-template-rows"));



        // Create each grid cell and assign row/column data attributes.
        for (let i = 0; i < rows * cols; i++) {
            const cell = document.createElement("div");
            cell.classList.add("grid-cell");

            // Calculate 0-indexed row and column for the cell.
            let row = Math.floor(i / cols);
            let col = i % cols;
            cell.dataset.row = row;
            cell.dataset.col = col;

            // Set cell dimensions.
            cell.style.width = cellSize + "px";
            cell.style.height = cellSize + "px";

            // Optionally assign a dummy event value (used during testing)
            if (i % 2 === 0) {
                cell.dataset.event = "A";
            } else if (i % 3 === 0) {
                cell.dataset.event = "B";
            } else {
                cell.dataset.event = "A ∩ B";
            }

            gridContainer.appendChild(cell);
        }

        // Display grid information (e.g., "Total Grid Squares: 16 squares (4x4)").
        const totalSquares = rows * cols;
        const gridInfo = document.createElement("div");
        gridInfo.classList.add("grid-info-line");
        gridInfo.textContent = `Total Grid Squares: ${totalSquares} squares (${rows}x${cols})`;
        const gridInfoContainer = document.getElementById("grid-info");
        gridInfoContainer.innerHTML = "";
        gridInfoContainer.appendChild(gridInfo);
    };


    // Toggle info label when the info button is clicked
  document.getElementById('info-button').addEventListener('click', function() {
    var infoLabel = document.getElementById('info-label');
    // Toggle display: if hidden, show it; if shown, hide it.
    if (infoLabel.style.display === 'none' || infoLabel.style.display === '') {
      infoLabel.style.display = 'block';
    } else {
      infoLabel.style.display = 'none';
    }
  });

    // Box-Related Functions (Creation, Dragging, Rotation)

    // getBoxRegion(box) returns the grid region covered by a box
    function getBoxRegion(box) {
        // Get the box's current top-left position and its size in terms of grid cells.
        const left = parseInt(box.style.left, 10);
        const top = parseInt(box.style.top, 10);
        const widthCells = parseInt(box.dataset.width, 10);
        const heightCells = parseInt(box.dataset.height, 10);

        // Calculate the starting column and row (0-indexed) using the cellSize.
        const startCol = Math.round(left / cellSize);
        const startRow = Math.round(top / cellSize);
        return {
            startRow: startRow,
            endRow: startRow + heightCells,   // non-inclusive end
            startCol: startCol,
            endCol: startCol + widthCells       // non-inclusive end
        };
    }

    // addBox() creates a new box with the given size, assigns it a color (cycling through the list),
    // and appends it to the grid. Also attaches dragging functionality.
    window.addBox = function() {
        if (boxes.length >= 3) {
            alert("Only 3 boxes allowed");
            return;
        }

        const boxInput = document.getElementById("box-size").value;
        const [width, height] = boxInput.split("x").map(Number);
        if (!width || !height) {
            alert("Please enter a valid box size (e.g., 2x2)");
            return;
        }

        // Enforce maximum box size of 15x15.
        if (width > 15 || height > 15) {
            alert("Maximum box size is 15x15");
            return;
        }

        // Create the box element.
        const box = document.createElement("div");
        box.classList.add("box");

        // Set the box's dimensions (scaled by cellSize).
        box.style.width = `${width * cellSize}px`;
        box.style.height = `${height * cellSize}px`;
        box.dataset.width = width;
        box.dataset.height = height;

        // Create and append the label (from boxLabels array) to the box.
        const label = document.createElement("div");
        label.classList.add("box-label");
        label.textContent = boxLabels[boxes.length];
        box.appendChild(label);

        // Set the initial background color (cycling through boxColors) and position.
        box.style.background = getRandomColor();
        box.style.left = "0px";
        box.style.top = "0px";

        // Append the box to the grid container.
        const gridContainer = document.getElementById("grid");
        gridContainer.appendChild(box);


        // Box Dragging Functionality

        let isDragging = false;
        box.addEventListener("mousedown", function(event) {
            if (isLocked || isDragging) return;
            event.preventDefault();

            // Mark this box as selected and highlight it.
            selectedBox = box;
            highlightSelectedBox(box);

            // Get the grid container's position and adjust for its border.
            let containerRect = gridContainer.getBoundingClientRect();
            let containerStyle = window.getComputedStyle(gridContainer);
            let borderTop = parseInt(containerStyle.borderTopWidth, 10);
            let borderLeft = parseInt(containerStyle.borderLeftWidth, 10);
            let containerLeft = containerRect.left + window.pageXOffset + borderLeft;
            let containerTop = containerRect.top + window.pageYOffset + borderTop;

            // Calculate the initial offset between the mouse and the box's top-left corner.
            let shiftX = event.pageX - containerLeft - box.offsetLeft;
            let shiftY = event.pageY - containerTop - box.offsetTop;

            isDragging = true;

            // Move the box as the mouse moves.
            function onMouseMove(event) {
                let x = event.pageX - containerLeft - shiftX;
                let y = event.pageY - containerTop - shiftY;

                // Ensure the box stays within the grid container.
                x = Math.max(0, Math.min(x, gridContainer.clientWidth - box.offsetWidth));
                y = Math.max(0, Math.min(y, gridContainer.clientHeight - box.offsetHeight));

                box.style.left = x + "px";
                box.style.top = y + "px";
            }

            document.addEventListener("mousemove", onMouseMove);

            // When the mouse is released, snap the box to the grid and reset the border.
            function onMouseUp() {
                document.removeEventListener("mousemove", onMouseMove);
                isDragging = false;
                snapToGrid(box);
                box.style.border = "2px solid black";
            }

            document.addEventListener("mouseup", onMouseUp, { once: true });
        });

        // Display information about the box in the "box-info" area.
        const boxInfo = document.createElement("div");
        boxInfo.classList.add("box-info-line");
        boxInfo.textContent = `Box ${boxLabels[boxes.length]}: ${width * height} squares (${width}x${height})`;
        document.getElementById("box-info").appendChild(boxInfo);

        // Add the box to the global boxes array.
        boxes.push(box);
    };
    // Global keydown listener for rotation:
    document.addEventListener("keydown", function(event) {
    if (event.key === "r") {
      console.log("Key 'r' pressed. Selected box:", selectedBox);
      if (selectedBox && !isLocked) {
        event.preventDefault();
        rotateBox(selectedBox);
      } else {
        console.log("No box is selected or box movement is locked.");
        }
        }
    }, true);

    // snapToGrid() adjusts a box's position so it aligns with the grid cells.
    function snapToGrid(box) {
        const gridContainer = document.getElementById("grid");
        let currentLeft = parseInt(box.style.left, 10);
        let currentTop = parseInt(box.style.top, 10);

        // Round to the nearest multiple of cellSize.
        let x = Math.round(currentLeft / cellSize) * cellSize;
        let y = Math.round(currentTop / cellSize) * cellSize;

        // Ensure the box remains within the grid.
        x = Math.max(0, Math.min(x, gridContainer.clientWidth - box.offsetWidth));
        y = Math.max(0, Math.min(y, gridContainer.clientHeight - box.offsetHeight));

        box.style.left = `${x}px`;
        box.style.top = `${y}px`;
    }

    // highlightSelectedBox() visually highlights a box when it is selected.
    function highlightSelectedBox(box) {
        // Reset borders for all boxes.
        document.querySelectorAll(".box").forEach(b => {
            b.style.border = "2px solid black";
        });
        // Set a thicker border for the selected box.
        box.style.border = "3px solid black";
    }

    // Global Keyboard Handling (for box rotation)
    // When the user presses the "r" key, if a box is selected and not locked, rotate the box.
    document.addEventListener("keydown", function(event) {
        if (event.key === "r" && selectedBox && !isLocked) {
            event.preventDefault();
            rotateBox(selectedBox);
        }
    }, true);

    // Highlighting Functions

    // removeHighlights() clears all highlight dots and removes any bold condition-box styling.
    function removeHighlights() {
        // Remove any highlight dots from grid cells.
        document.querySelectorAll(".highlight-dot").forEach(dot => {
            dot.remove();
        });
        // Remove the "condition-box" class from any boxes to revert bold borders.
        document.querySelectorAll(".condition-box").forEach(box => {
            box.classList.remove("condition-box");
        });
        console.log("Highlights removed.");
    }

    // This function counts highlighted cells and updates the result label.
function updateResultLabel() {
    // Get all grid cells
    const gridCells = document.querySelectorAll(".grid-cell");
    let highlightedCount = 0;

    // For each cell, check if it contains a highlight dot.
    gridCells.forEach(cell => {
        if (cell.querySelector(".highlight-dot")) {
            highlightedCount++;
        }
    });

    // Update the result label (displaying affected/total)
    document.getElementById("result-label").textContent =
        `Result: ${highlightedCount} / ${gridCells.length} grid cells highlighted`;
}

    // Returns true if the grid cell satisfies the condition for the given token.
    // A token is a string like "A" or "A^c".
    function cellSatisfiesToken(cell, token) {
    // Determine whether this token is complemented.
    const isComplement = token.endsWith("^c");
    // Remove the "^c" if present to obtain the box letter.
    const letter = isComplement ? token.slice(0, token.length - 2) : token;

    // Get the corresponding box element.
    const box = getBoxByLabel(letter);
    if (!box) return false; // or alert the user

    // Get the region of the box.
    const region = getBoxRegion(box);

    // Get the row and column of the current cell.
    const row = parseInt(cell.dataset.row, 10);
    const col = parseInt(cell.dataset.col, 10);

    // Check if the cell lies within the box region.
    const inRegion = (row >= region.startRow && row < region.endRow &&
                      col >= region.startCol && col < region.endCol);

    // For a complemented token, we return the opposite.
    return isComplement ? !inRegion : inRegion;
    }


    // Expose removeHighlights globally.
    window.removeHighlights = removeHighlights;

    // highlightGridCellsForConditional() handles conditional expressions.
    // It highlights grid cells that fall within the intersection of the left event region and the condition region.
    // leftExp and condExp are strings that can be a single letter (e.g., "A") or a two-box expression (e.g., "AUB" or "A∩B").
    function highlightGridCellsForConditional(leftExp, condExp) {
        // Remove any whitespace from the expressions.
        leftExp = leftExp.replace(/\s/g, '');
        condExp = condExp.replace(/\s/g, '');

        // Parse leftExp: determine if it contains a union or intersection operator.
        let leftOperator = null;
        let leftBox1Letter, leftBox2Letter;
        if (leftExp.includes("U") || leftExp.includes("∪")) {
            leftOperator = "union";
        } else if (leftExp.includes("∩") || leftExp.includes("|")) {
            leftOperator = "intersection";
        }
        if (leftOperator) {
            leftBox1Letter = leftExp.charAt(0);
            leftBox2Letter = leftExp.charAt(2);
        } else {
            leftBox1Letter = leftExp;
        }

        // Parse condExp similarly.
        let condOperator = null;
        let condBox1Letter, condBox2Letter;
        if (condExp.includes("U") || condExp.includes("∪")) {
            condOperator = "union";
        } else if (condExp.includes("∩") || condExp.includes("|")) {
            condOperator = "intersection";
        }
        if (condOperator) {
            condBox1Letter = condExp.charAt(0);
            condBox2Letter = condExp.charAt(2);
        } else {
            condBox1Letter = condExp;
        }

        // Retrieve left-side box elements.
        let leftBoxes = [];
        const lb1 = getBoxByLabel(leftBox1Letter);
        if (lb1) leftBoxes.push(lb1);
        if (leftOperator && leftBox2Letter) {
            const lb2 = getBoxByLabel(leftBox2Letter);
            if (lb2) leftBoxes.push(lb2);
        }
        if (leftBoxes.length === 0) {
            alert("Left event box not found.");
            return;
        }

        // Retrieve condition box elements.
        let condBoxes = [];
        const cb1 = getBoxByLabel(condBox1Letter);
        if (cb1) condBoxes.push(cb1);
        if (condOperator && condBox2Letter) {
            const cb2 = getBoxByLabel(condBox2Letter);
            if (cb2) condBoxes.push(cb2);
        }
        if (condBoxes.length === 0) {
            alert("Condition box not found.");
            return;
        }

        // Compute the region for the left event.
        let leftRegion;
        if (leftBoxes.length === 1) {
            leftRegion = getBoxRegion(leftBoxes[0]);
        } else {
            const r1 = getBoxRegion(leftBoxes[0]);
            const r2 = getBoxRegion(leftBoxes[1]);
            if (leftOperator === "union") {
                leftRegion = {
                    startRow: Math.min(r1.startRow, r2.startRow),
                    endRow: Math.max(r1.endRow, r2.endRow),
                    startCol: Math.min(r1.startCol, r2.startCol),
                    endCol: Math.max(r1.endCol, r2.endCol)
                };
            } else if (leftOperator === "intersection") {
                leftRegion = {
                    startRow: Math.max(r1.startRow, r2.startRow),
                    endRow: Math.min(r1.endRow, r2.endRow),
                    startCol: Math.max(r1.startCol, r2.startCol),
                    endCol: Math.min(r1.endCol, r2.endCol)
                };
            }
        }

        // Compute the region for the condition.
        let condRegion;
        if (condBoxes.length === 1) {
            condRegion = getBoxRegion(condBoxes[0]);
        } else {
            const r1 = getBoxRegion(condBoxes[0]);
            const r2 = getBoxRegion(condBoxes[1]);
            if (condOperator === "union") {
                condRegion = {
                    startRow: Math.min(r1.startRow, r2.startRow),
                    endRow: Math.max(r1.endRow, r2.endRow),
                    startCol: Math.min(r1.startCol, r2.startCol),
                    endCol: Math.max(r1.endCol, r2.endCol)
                };
            } else if (condOperator === "intersection") {
                condRegion = {
                    startRow: Math.max(r1.startRow, r2.startRow),
                    endRow: Math.min(r1.endRow, r2.endRow),
                    startCol: Math.max(r1.startCol, r2.startCol),
                    endCol: Math.min(r1.endCol, r2.endCol)
                };
            }
        }

        // For each grid cell, if it lies within both the left event region and the condition region, add a highlight dot.
        document.querySelectorAll(".grid-cell").forEach(cell => {
            const row = parseInt(cell.dataset.row, 10);
            const col = parseInt(cell.dataset.col, 10);
            const inLeft = (row >= leftRegion.startRow && row < leftRegion.endRow &&
                            col >= leftRegion.startCol && col < leftRegion.endCol);
            const inCond = (row >= condRegion.startRow && row < condRegion.endRow &&
                            col >= condRegion.startCol && col < condRegion.endCol);
            if (inLeft && inCond) {
                const dot = document.createElement("div");
                dot.classList.add("highlight-dot");
                const diameter = cellSize * 0.4;
                dot.style.width = diameter + "px";
                dot.style.height = diameter + "px";
                dot.style.top = "50%";
                dot.style.left = "50%";
                dot.style.transform = "translate(-50%, -50%)";
                dot.style.backgroundColor = "black";
                cell.appendChild(dot);
            }
        });
    }

    // token1 and token2 are strings such as "A", "B^c", etc.
// operator is expected to be union ("U" or "∪") or intersection ("∩" or "|").
function highlightGridCellsForTwoTokens(token1, token2, operator) {
    document.querySelectorAll(".grid-cell").forEach(cell => {
        let conditionMet = false;
        if (operator === "U" || operator === "∪") {
            // For union: highlight if the cell satisfies token1 OR token2.
            conditionMet = cellSatisfiesToken(cell, token1) || cellSatisfiesToken(cell, token2);
        } else if (operator === "∩" || operator === "|") {
            // For intersection: highlight if the cell satisfies both tokens.
            conditionMet = cellSatisfiesToken(cell, token1) && cellSatisfiesToken(cell, token2);
        }

        if (conditionMet) {
            // Create the highlight dot.
            const dot = document.createElement("div");
            dot.classList.add("highlight-dot");
            const diameter = cellSize * 0.4;  // or adjust as desired
            dot.style.width = diameter + "px";
            dot.style.height = diameter + "px";
            dot.style.top = "50%";
            dot.style.left = "50%";
            dot.style.transform = "translate(-50%, -50%)";
            dot.style.zIndex = '2';
            cell.appendChild(dot);
        }
    });
}

// This function is used for expressions like P((AUB)^c)
function highlightGridCellsForCompoundComplement(token1, token2, operator) {
    document.querySelectorAll(".grid-cell").forEach(cell => {
        let compoundCondition = false;
        if (operator === "U" || operator === "∪") {
            // For union, the cell satisfies the union if it satisfies token1 OR token2.
            compoundCondition = cellSatisfiesToken(cell, token1) || cellSatisfiesToken(cell, token2);
        } else if (operator === "∩" || operator === "|") {
            // For intersection, the cell satisfies if it satisfies both.
            compoundCondition = cellSatisfiesToken(cell, token1) && cellSatisfiesToken(cell, token2);
        }
        // For the compound complement, we highlight the cell if it does NOT satisfy the compound condition.
        if (!compoundCondition) {
            const dot = document.createElement("div");
            dot.classList.add("highlight-dot");
            const diameter = cellSize * 0.4; // or adjust as needed
            dot.style.width = diameter + "px";
            dot.style.height = diameter + "px";
            dot.style.top = "50%";
            dot.style.left = "50%";
            dot.style.transform = "translate(-50%, -50%)";
            dot.style.zIndex = '2';
            cell.appendChild(dot);
        }
    });
}

function highlightGridCellsForCompoundConditional(tokens, operator, conditionToken) {
    document.querySelectorAll(".grid-cell").forEach(cell => {
        // Evaluate the compound left expression.
        let leftCondition = evaluateCompoundCondition(cell, tokens, operator);
        // Evaluate the condition token (using your existing cellSatisfiesToken function).
        let condCondition = cellSatisfiesToken(cell, conditionToken);
        // For conditional expressions, highlight only if both the left expression and the condition are true.
        if (leftCondition && condCondition) {
            const dot = document.createElement("div");
            dot.classList.add("highlight-dot");
            const diameter = cellSize * 0.4;  // adjust as needed
            dot.style.width = diameter + "px";
            dot.style.height = diameter + "px";
            dot.style.top = "50%";
            dot.style.left = "50%";
            dot.style.transform = "translate(-50%, -50%)";
            dot.style.zIndex = '2';
            cell.appendChild(dot);
        }
    });
}


    // Allow grid generation on Enter key for the grid-size input.
    document.getElementById("grid-size").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            generateGrid();
            this.blur();
        }
    });

    // Box Creation and Dragging (continued)

    // addBox() is already defined above.

    // Snap Box to Grid and Box Selection Highlighting (continued)

    // snapToGrid() and highlightSelectedBox() are already defined above.


    // Global Keydown for Box Rotation (when "r" is pressed)

    document.addEventListener("keydown", function(event) {
        if (event.key === "r" && selectedBox && !isLocked) {
            event.preventDefault();
            rotateBox(selectedBox);
        }
    }, true);

    // rotateBox() rotates a box by swapping its width and height.
    function rotateBox(box) {
        // Get the grid container and its full dimensions.
        const gridContainer = document.getElementById("grid");
        const gridWidth = gridContainer.offsetWidth;
        const gridHeight = gridContainer.offsetHeight;
        
        // Read the box's current dimensions (in grid cells) from its dataset.
        let currentWidth = parseInt(box.dataset.width, 10);
        let currentHeight = parseInt(box.dataset.height, 10);
        
        // Swap the dimensions in the dataset (rotating the box).
        box.dataset.width = currentHeight;
        box.dataset.height = currentWidth;
        
        // Calculate the new pixel dimensions.
        let newWidth = currentHeight * cellSize;
        let newHeight = currentWidth * cellSize;
        
        // Get the current position (top-left) of the box.
        let left = parseFloat(box.style.left) || 0;
        let top = parseFloat(box.style.top) || 0;
        
        // Clamp the left position so that left + newWidth does not exceed gridWidth.
        left = Math.min(left, gridWidth - newWidth);
        // Clamp the top position so that top + newHeight does not exceed gridHeight.
        top = Math.min(top, gridHeight - newHeight);
        
        // Ensure left and top are not negative.
        left = Math.max(0, left);
        top = Math.max(0, top);
        
        // Update the box's dimensions and position.
        box.style.width = newWidth + "px";
        box.style.height = newHeight + "px";
        box.style.left = left + "px";
        box.style.top = top + "px";
        
        snapToGrid(box);
        
        console.log("Rotated box. New dimensions (px):", newWidth, "x", newHeight, "at position:", left, top);
      }
      
      

    // Equation Bar Manipulation

    // addToEquation() appends a value (character) to the equation bar.
    window.addToEquation = function(value) {
        const equationBar = document.getElementById("equation-input");
        equationBar.textContent += value;
    };

    // Remove Highlights and Clear Grid Functions

    // removeHighlights() removes all highlight dots and any bold condition-box styling.
    function removeHighlights() {
        // Remove any highlight dots.
        document.querySelectorAll(".highlight-dot").forEach(dot => {
            dot.remove();
        });
        // Remove the "condition-box" class from boxes.
        document.querySelectorAll(".condition-box").forEach(box => {
            box.classList.remove("condition-box");
        });

        document.getElementById("result-label").textContent = ""; //Clear the result label
        console.log("Highlights removed.");
    }
    // Expose removeHighlights globally.
    window.removeHighlights = removeHighlights;

    function evaluateCompoundCondition(cell, tokens, operator) {
        // tokens is an array like ["B", "U", "C"] for "BUC".
        if (operator === "U" || operator === "∪") {
            // For union: the cell satisfies if it meets at least one token.
            for (let i = 0; i < tokens.length; i += 2) {
                if (cellSatisfiesToken(cell, tokens[i])) {
                    return true;
                }
            }
            return false;
        } else if (operator === "∩" || operator === "|" || operator === "n") {
            // For intersection: the cell must satisfy every token.
            for (let i = 0; i < tokens.length; i += 2) {
                if (!cellSatisfiesToken(cell, tokens[i])) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }


    // restartProgram() clears the equation bar, removes highlights, and deletes all boxes from the grid.
    window.restartProgram = function() {
        document.getElementById("equation-input").textContent = "";


        removeHighlights();  // Remove any highlight dots and condition box styles

        // Remove all boxes from the grid.
        const gridContainer = document.getElementById("grid");
        const boxesInGrid = gridContainer.querySelectorAll(".box");
        boxesInGrid.forEach(box => box.remove());

        // Clear the box information display.
        const boxInfoContainer = document.getElementById("box-info");
        if (boxInfoContainer) {
            boxInfoContainer.innerHTML = "";
        }

        // Reset global variables for boxes.
        boxes = [];
        selectedBox = null;

        //ensure the label result is cleared
        document.getElementById("result-label").textContent = "";

        console.log("Grid cleared and program restarted.");
    };

    // Equation Parsing and Highlighting (Main Calculation Function)

    // parseEquationAndHighlight() handles various equation formats, including conditional expressions and two-box expressions.
    window.parseEquationAndHighlight = function() {
        console.log("Calculate button pressed");
        let equation = document.getElementById("equation-input").textContent.trim();
        // Remove any whitespace.
        equation = equation.replace(/\s/g, '');
        console.log("Parsed equation:", equation);
        removeHighlights();

        // Branch 1: Simple conditional e.g., P(A|B)
        const simpleCondRegex = /^P\(([ABC](?:\^c)?)\|([ABC](?:\^c)?)\)$/;
        let match = equation.match(simpleCondRegex);
        if (match) {
            const leftToken = match[1];
            const rightToken = match[2];
            document.querySelectorAll(".grid-cell").forEach(cell => {
                if (cellSatisfiesToken(cell, leftToken) && cellSatisfiesToken(cell, rightToken)) {
                    const dot = document.createElement("div");
                    dot.classList.add("highlight-dot");
                    const diameter = cellSize * 0.4;
                    dot.style.width = diameter + "px";
                    dot.style.height = diameter + "px";
                    dot.style.top = "50%";
                    dot.style.left = "50%";
                    dot.style.transform = "translate(-50%, -50%)";
                    dot.style.zIndex = '2';
                    cell.appendChild(dot);
                }
            });
            // Bolden the condition box
        const conditionBox = getBoxByLabel(rightToken);
        if (conditionBox) {
            conditionBox.classList.add("condition-box");
        }
        updateResultLabel();
        return;
        }

        // Branch 2: Compound condition on the right, e.g., P(A|BUC)
        const compoundRightRegex = /^P\(([ABC](?:\^c)?)\|((?:[ABC](?:\^c)?(?:[U∪∩\|n][ABC](?:\^c)?)+))\)$/;
        match = equation.match(compoundRightRegex);
        if (match) {
            const leftToken = match[1];
            const conditionExpr = match[2];
            let condTokens = conditionExpr.split(/([U∪∩\|n])/);
            const mainOperator = condTokens[1];
            document.querySelectorAll(".grid-cell").forEach(cell => {
                const leftOK = cellSatisfiesToken(cell, leftToken);
                const condOK = evaluateCompoundCondition(cell, condTokens, mainOperator);
                if (leftOK && condOK) {
                    const dot = document.createElement("div");
                    dot.classList.add("highlight-dot");
                    const diameter = cellSize * 0.4;
                    dot.style.width = diameter + "px";
                    dot.style.height = diameter + "px";
                    dot.style.top = "50%";
                    dot.style.left = "50%";
                    dot.style.transform = "translate(-50%, -50%)";
                    dot.style.zIndex = '2';
                    cell.appendChild(dot);
                }
            });
            // Bolden each condition box in the compound condition.
            // condTokens should be like ["B", "U", "C"] (ignoring operators)
            condTokens.forEach(token => {
                if (/^[ABC](?:\^c)?$/.test(token)) {
                    const box = getBoxByLabel(token);
                    if (box) {
                        box.classList.add("condition-box");
                    }
                }
            });
            updateResultLabel();
            return;
        }

        // Branch 3: Single token, e.g., P(A)
        const singleTokenRegex = /^P\(([ABC](?:\^c)?)\)$/;
        match = equation.match(singleTokenRegex);
        if (match) {
            const token = match[1];
            document.querySelectorAll(".grid-cell").forEach(cell => {
                if (cellSatisfiesToken(cell, token)) {
                    const dot = document.createElement("div");
                    dot.classList.add("highlight-dot");
                    const diameter = cellSize * 0.4;
                    dot.style.width = diameter + "px";
                    dot.style.height = diameter + "px";
                    dot.style.top = "50%";
                    dot.style.left = "50%";
                    dot.style.transform = "translate(-50%, -50%)";
                    dot.style.zIndex = '2';
                    cell.appendChild(dot);
                }
            });
            updateResultLabel();
            return;
        }

        // Branch 4: Compound complement, e.g., P((AUB)^c)
        const compoundComplementRegex = /^P\(\(([ABC](?:\^c)?)([U∪∩\|])([ABC](?:\^c)?)\)\^c\)$/;
        match = equation.match(compoundComplementRegex);
        if (match) {
            const token1 = match[1];
            const operator = match[2];
            const token2 = match[3];
            highlightGridCellsForCompoundComplement(token1, token2, operator);
            updateResultLabel();
            return;
        }

        // Branch 5: Compound left with condition, e.g., P(AnB|C) or P(A∩B|C)
        const compoundLeftRegex = /^P\(([ABC](?:\^c)?(?:[U∪∩\|n][ABC](?:\^c)?)+)\|([ABC](?:\^c)?)\)$/;
        match = equation.match(compoundLeftRegex);
        if (match) {
            const leftExpression = match[1];
            const conditionToken = match[2];
            let tokens = leftExpression.split(/([U∪∩\|n])/);
            const mainOperator = tokens[1];
            highlightGridCellsForCompoundConditional(tokens, mainOperator, conditionToken);
            const conditionBox = getBoxByLabel(conditionToken);
        if (conditionBox) {
            conditionBox.classList.add("condition-box");
        }
        updateResultLabel();
        return;
        }

        // Branch 6: Compound Expression (no condition), e.g., P(AUC) or P(AnC)
    const compoundRegex = /^P\(([ABC](?:\^c)?(?:[U∪∩\|n][ABC](?:\^c)?)+)\)$/;
    match = equation.match(compoundRegex);
    if (match) {
        // The entire compound expression (like "AUC" or "A∩C") is in match[1]
        let compoundExpression = match[1];
        // Split the expression using the operator as delimiter.
        let tokens = compoundExpression.split(/([U∪∩\|n])/);
        if (tokens.length === 3) {
            // Exactly two tokens.
            const token1 = tokens[0];
            const operator = tokens[1];
            const token2 = tokens[2];
            document.querySelectorAll(".grid-cell").forEach(cell => {
                let conditionMet = false;
                if (operator === "U" || operator === "∪") {
                    conditionMet = cellSatisfiesToken(cell, token1) || cellSatisfiesToken(cell, token2);
                } else if (operator === "∩" || operator === "|" || operator === "n") {
                    conditionMet = cellSatisfiesToken(cell, token1) && cellSatisfiesToken(cell, token2);
                }
                if (conditionMet) {
                    const dot = document.createElement("div");
                    dot.classList.add("highlight-dot");
                    const diameter = cellSize * 0.4;
                    dot.style.width = diameter + "px";
                    dot.style.height = diameter + "px";
                    dot.style.top = "50%";
                    dot.style.left = "50%";
                    dot.style.transform = "translate(-50%, -50%)";
                    dot.style.zIndex = '2';
                    cell.appendChild(dot);
                }
            });
            updateResultLabel();
            return;
        } else {
            // More than two tokens—handle using our compound evaluation helper.
            const mainOperator = tokens[1];
            document.querySelectorAll(".grid-cell").forEach(cell => {
                if (evaluateCompoundCondition(cell, tokens, mainOperator)) {
                    const dot = document.createElement("div");
                    dot.classList.add("highlight-dot");
                    const diameter = cellSize * 0.4;
                    dot.style.width = diameter + "px";
                    dot.style.height = diameter + "px";
                    dot.style.top = "50%";
                    dot.style.left = "50%";
                    dot.style.transform = "translate(-50%, -50%)";
                    dot.style.zIndex = '2';
                    cell.appendChild(dot);
                }
            });
            updateResultLabel();
            return;
        }
    }

        // Branch 7: Fallback for known simple expressions like P(A), P(B), P(C)
        if (equation === "P(A)" || equation === "P(B)" || equation === "P(C)") {
            let letter = equation.charAt(2);
            const box = getBoxByLabel(letter);
            if (box) {
                highlightGridCellsForBox(box);
            } else {
                alert("Box " + letter + " not found!");
            }
            updateResultLabel();
            return;
        }

        // If no supported format is matched:
        alert("Unsupported equation: " + equation);
    };



    // Basic Highlighting Functions for Single Box and Intersection

    // highlightGridCellsForBox() adds a black dot to every grid cell covered by the box.
    function highlightGridCellsForBox(box) {
        // Determine the box's grid region based on its position and dimensions.
        const left = parseInt(box.style.left, 10);
        const top = parseInt(box.style.top, 10);
        const widthCells = parseInt(box.dataset.width, 10);
        const heightCells = parseInt(box.dataset.height, 10);

        // Compute the starting (row, col) indices.
        const startCol = Math.round(left / cellSize);
        const startRow = Math.round(top / cellSize);

        // Define the ending indices (non-inclusive).
        const endCol = startCol + widthCells;
        const endRow = startRow + heightCells;

        // Loop over each grid cell in the region and add a dot.
        document.querySelectorAll(".grid-cell").forEach(cell => {
            const row = parseInt(cell.dataset.row, 10);
            const col = parseInt(cell.dataset.col, 10);
            if (row >= startRow && row < endRow && col >= startCol && col < endCol) {
                const dot = document.createElement("div");
                dot.classList.add("highlight-dot");
                // Set the dot's diameter to 40% of cellSize.
                const diameter = cellSize * 0.4;
                dot.style.width = diameter + "px";
                dot.style.height = diameter + "px";
                // Center the dot in the grid cell.
                dot.style.top = "50%";
                dot.style.left = "50%";
                dot.style.transform = "translate(-50%, -50%)";
                // Force the dot color to be black.
                dot.style.backgroundColor = "black";
                cell.appendChild(dot);
            }
        });
    }

    // highlightGridCellsForIntersection() highlights the overlapping region between two boxes.
    function highlightGridCellsForIntersection(box1, box2, highlightColor = "green") {
        // Compute the grid region for box1.
        const left1 = parseInt(box1.style.left, 10);
        const top1 = parseInt(box1.style.top, 10);
        const widthCells1 = parseInt(box1.dataset.width, 10);
        const heightCells1 = parseInt(box1.dataset.height, 10);
        const startCol1 = Math.round(left1 / cellSize);
        const startRow1 = Math.round(top1 / cellSize);
        const endCol1 = startCol1 + widthCells1;
        const endRow1 = startRow1 + heightCells1;

        // Compute the grid region for box2.
        const left2 = parseInt(box2.style.left, 10);
        const top2 = parseInt(box2.style.top, 10);
        const widthCells2 = parseInt(box2.dataset.width, 10);
        const heightCells2 = parseInt(box2.dataset.height, 10);
        const startCol2 = Math.round(left2 / cellSize);
        const startRow2 = Math.round(top2 / cellSize);
        const endCol2 = startCol2 + widthCells2;
        const endRow2 = startRow2 + heightCells2;

        // Determine the overlapping region.
        const overlapStartCol = Math.max(startCol1, startCol2);
        const overlapEndCol = Math.min(endCol1, endCol2);
        const overlapStartRow = Math.max(startRow1, startRow2);
        const overlapEndRow = Math.min(endRow1, endRow2);

        // If there is no overlap, alert the user.
        if (overlapStartCol >= overlapEndCol || overlapStartRow >= overlapEndRow) {
            alert("Boxes do not overlap!");
            return;
        }

        // Loop over grid cells in the overlapping region and add a dot.
        document.querySelectorAll(".grid-cell").forEach(cell => {
            const row = parseInt(cell.dataset.row, 10);
            const col = parseInt(cell.dataset.col, 10);
            if (row >= overlapStartRow && row < overlapEndRow &&
                col >= overlapStartCol && col < overlapEndCol) {
                const dot = document.createElement("div");
                dot.classList.add("highlight-dot");
                const diameter = cellSize * 0.4;
                dot.style.width = diameter + "px";
                dot.style.height = diameter + "px";
                dot.style.top = "50%";
                dot.style.left = "50%";
                dot.style.transform = "translate(-50%, -50%)";
                dot.style.backgroundColor = "black";
                cell.appendChild(dot);
            }
        });
    }

    // getBoxByLabel() returns the box element whose label matches the given letter.
    function getBoxByLabel(label) {
        const boxes = document.querySelectorAll('.box');
        for (let box of boxes) {
            const boxLabel = box.querySelector('.box-label');
            if (boxLabel && boxLabel.textContent.trim() === label) {
                return box;
            }
        }
        return null;
    }

    // Event Listener for Box-Size Input: Allow "Enter" to add a box.
    document.getElementById("box-size").addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            addBox();
        }
    });

});

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
    
        // Set the dimensions of the grid container based on cellSize.
        gridContainer.style.width = (cols * cellSize) + "px";
        gridContainer.style.height = (rows * cellSize) + "px";
        gridContainer.style.display = "grid";
        gridContainer.style.gridTemplateColumns = `repeat(${cols}, $ cellSize}px)`;
        gridContainer.style.gridTemplateRows = `repeat(${rows}, $ cellSize}px)`;
        gridContainer.style.position = "relative";
        
        // Add a border around the entire grid.
        gridContainer.style.border = "2px solid black";
        
        // Center the grid container in its parent.
        gridContainer.style.margin = "20px auto";
    
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
    
    // Equation Bar Setup and Caret Handling

    const prefix = "Equation: "; // Fixed prefix that should remain unaltered
    const equationBar = document.getElementById("equation-bar");

    // Ensure that the equation bar starts with the fixed prefix.
    if (!equationBar.textContent.startsWith(prefix)) {
        equationBar.textContent = prefix;
    }

    // When the equation bar receives focus, move the caret to the end.
    equationBar.addEventListener("focus", function() {
        placeCaretAtEnd(equationBar);
    });

    // When the user clicks inside the equation bar, if the caret is before the prefix, reposition it to the end.
    equationBar.addEventListener("click", function() {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            if (range.startOffset < prefix.length) {
                placeCaretAtEnd(equationBar);
            }
        }
    });

    // On input, check that the text always starts with the fixed prefix.
    // If the prefix has been altered or removed, restore it.
    equationBar.addEventListener("input", function() {
        if (!equationBar.textContent.startsWith(prefix)) {
            let current = equationBar.textContent;
            // Remove any characters before the prefix's length.
            if (current.length >= prefix.length) {
                current = current.substring(prefix.length);
            } else {
                current = "";
            }
            equationBar.textContent = prefix + current;
            placeCaretAtEnd(equationBar);
        }
    });

    // Helper function: Place caret at the end of a contenteditable element.
    function placeCaretAtEnd(el) {
        el.focus();
        if (typeof window.getSelection != "undefined" &&
            typeof document.createRange != "undefined") {
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

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
    
    // rotateBox() swaps the width and height (effectively rotating the box 90°)
    function rotateBox(box) {
        const currentWidth = parseInt(box.dataset.width, 10);
        const currentHeight = parseInt(box.dataset.height, 10);
        
        // Swap the dataset values.
        box.dataset.width = currentHeight;
        box.dataset.height = currentWidth;
        
        // Update the box's visual dimensions.
        box.style.width = (currentHeight * cellSize) + "px";
        box.style.height = (currentWidth * cellSize) + "px";
        
        // Snap the box to the grid after rotation.
        snapToGrid(box);
    }

    // Equation Bar Manipulation Functions

    // addToEquation() appends a character to the equation bar. Used by the equation-building buttons.
    window.addToEquation = function(value) {
        const equationBar = document.getElementById("equation-bar");
        equationBar.textContent += value;
    };
    
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
                const diameter = cellSize * 0.6;
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
    
    // highlightGridCellsForUnion() adds a dot in every cell that lies in the union of two box regions.
    function highlightGridCellsForUnion(box1, box2, highlightColor = "yellow") {
        // Compute the grid region for both boxes.
        const region1 = getBoxRegion(box1);
        const region2 = getBoxRegion(box2);
      
        // Loop over all grid cells.
        document.querySelectorAll(".grid-cell").forEach(cell => {
            const row = parseInt(cell.dataset.row, 10);
            const col = parseInt(cell.dataset.col, 10);
            // Check if the cell is in either region.
            const inRegion1 = (row >= region1.startRow && row < region1.endRow &&
                               col >= region1.startCol && col < region1.endCol);
            const inRegion2 = (row >= region2.startRow && row < region2.endRow &&
                               col >= region2.startCol && col < region2.endCol);
            if (inRegion1 || inRegion2) {
                const dot = document.createElement("div");
                dot.classList.add("highlight-dot");
                const diameter = cellSize * 0.6;
                dot.style.width = diameter + "px";
                dot.style.height = diameter + "px";
                dot.style.top = "50%";
                dot.style.left = "50%";
                dot.style.transform = "translate(-50%, -50%)";
                // Always force the dot to be black.
                dot.style.backgroundColor = "black";
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
        const currentWidth = parseInt(box.dataset.width, 10);
        const currentHeight = parseInt(box.dataset.height, 10);
        
        // Swap width and height in the dataset.
        box.dataset.width = currentHeight;
        box.dataset.height = currentWidth;
        
        // Update the visual dimensions accordingly.
        box.style.width = (currentHeight * cellSize) + "px";
        box.style.height = (currentWidth * cellSize) + "px";
        
        // Snap the box to the grid after rotation.
        snapToGrid(box);
    }
    
    // Equation Bar Manipulation

    // addToEquation() appends a value (character) to the equation bar.
    window.addToEquation = function(value) {
        const equationBar = document.getElementById("equation-bar");
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
        console.log("Highlights removed.");
    }
    // Expose removeHighlights globally.
    window.removeHighlights = removeHighlights;
 
    // restartProgram() clears the equation bar, removes highlights, and deletes all boxes from the grid.
    window.restartProgram = function() {
        const equationBar = document.getElementById("equation-bar");
        equationBar.textContent = "Equation:";  // Reset the equation bar
    
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
    
        console.log("Grid cleared and program restarted.");
    };
    
    // Equation Parsing and Highlighting (Main Calculation Function)
    
    // parseEquationAndHighlight() handles various equation formats, including conditional expressions and two-box expressions.
    window.parseEquationAndHighlight = function() {
        console.log("Calculate button pressed");
      
        const equationBar = document.getElementById("equation-bar");
        let equation = equationBar.textContent.trim();
        // Remove the prefix "Equation:" if present.
        if (equation.startsWith("Equation:")) {
            equation = equation.replace("Equation:", "").trim();
        }
        // Remove all whitespace from the equation.
        equation = equation.replace(/\s/g, '');
        console.log("Parsed equation:", equation);
      
        // Clear any previous highlights.
        removeHighlights();
      
        // Check for conditional expressions that allow the condition to be one or two boxes.
        // The regex matches patterns like P(A|B), P(AUB|C), or P(A∩B|B∩C)
        const condRegex = /^P\(([^|]+)\|(([ABC](?:[∪U∩\|][ABC])?))\)$/;
        const condMatches = equation.match(condRegex);
        if (condMatches) {
            const leftExp = condMatches[1];  // Left side expression (e.g., "A" or "AUB" or "A∩B")
            const condExp = condMatches[2];    // Condition expression (e.g., "B" or "BUC" or "B∩C")
            // Highlight grid cells that are in the intersection of the left event region and the condition region.
            highlightGridCellsForConditional(leftExp, condExp);
            // Bolden the perimeter of each box used in the condition expression.
            for (let i = 0; i < condExp.length; i++) {
                let ch = condExp[i];
                if (ch === "U" || ch === "∪" || ch === "∩" || ch === "|") continue;
                const condBox = getBoxByLabel(ch);
                if (condBox) {
                    condBox.classList.add("condition-box");
                }
            }
            return;
        }
      
        // If not conditional, check for two-box expressions without a condition.
        const regex = /^P\(([ABC])([∩\|U∪])([ABC])\)$/;
        const matches = equation.match(regex);
        if (matches) {
            let box1Letter = matches[1];
            let operator = matches[2];
            let box2Letter = matches[3];
            const box1 = getBoxByLabel(box1Letter);
            const box2 = getBoxByLabel(box2Letter);
            if (!box1 || !box2) {
                alert("Box " + box1Letter + " and/or " + box2Letter + " not found!");
                return;
            }
            if (operator === "∩" || operator === "|") {
                highlightGridCellsForIntersection(box1, box2);
            } else if (operator === "U" || operator === "∪") {
                highlightGridCellsForUnion(box1, box2);
            } else {
                alert("Unsupported operator: " + operator);
            }
            return;
        }
      
        // handle single-box expressions such as P(A), P(B), or P(C).
        if (equation === "P(A)" || equation === "P(B)" || equation === "P(C)") {
            let letter = equation.charAt(2);
            const box = getBoxByLabel(letter);
            if (box) {
                highlightGridCellsForBox(box);
            } else {
                alert("Box " + letter + " not found!");
            }
            return;
        }
      
        // If no supported equation format is matched, alert the user.
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
                // Set the dot's diameter to 60% of cellSize.
                const diameter = cellSize * 0.6;
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
                const diameter = cellSize * 0.6;
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
    document.getElementById("box-size").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            addBox();
        }
    });
});

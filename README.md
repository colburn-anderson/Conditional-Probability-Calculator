# Conditional Probability Calculator
The Conditional Probability Calculator is an interactive, web-based tool that helps users visualize and compute conditional probabilities through a dynamic grid interface. No downloads or installations are requires--simply visit the website and start exploring!

Try it [here](https://bit.ly/conditional_probability)

--------------------------------------------------------------------------------------------------

**Overview**

The Conditional Probability Calculator is designed to help you understand how different ecents interact in a probability space. Using a grid-based interface:

- You can create a grid (up to 15x15 cells) by entering a grid size.
- You can add up to three dragable and rotatable boxes that represent events.
- You can build probability equations using the interactive equation bar and provided buttons.
- The calculator visually highlights the corresponding grid cells (with black dots) for the specified event and bolds the "given" box for conditional expressions.

---------------------------------------------------------------------------------------------------

**Features**

Dynamic Grid Generation:

- Create a grid with customizable dimensions to serve as the probability space.

Box Creation and Manipulation:

- Add up to three boxes that represent different events. Boxes are dragged into the proper  position and snap to the grid when released. Boxes can be rotated using the 'r' key.

Interactive Equation Bar:
- Use the interactive equation bar to build probability expressions with buttons that insert operators and event labels.

- The equation bar is prefilled with the fixed text "Equation: " so you only need to add your desired equation

Visual Highlighting: 


- Single Event: Highlights all grid cells covered by a specific box.
  
- Intersection/Union of Events: Highlights the overlapping grid cells for two events.
  
- Conditional Probability: When you specify a condition, the calculator highlights the corresponding cells and bolds the border of the condition box to emphasize the "given" event

--------------------------------------------------------------------------------------------------

**How to Use the Calculator**

Generating the Grid
1. Enter the Grid Size:
	- In the 'box size' input field, type the dimensions of the box in the format width x height (e.g., 2x2).
	- The maximum allowed box size is 15x15.
2. Set the Grid:
	- Click the 'Set Grid' button.
	- The grid will generate with the specified number of rows and columns. 

Adding and Manipulating Boxes

1. Enter Box Size:
	- In the 'box size' input field, type the dimensions of the box in the format      width x height

2. Add a box (or three):
	- Click the 'Add Box' button (or press 'Enter' in the 'box size' field.
	- Boxes are automatically labeled (A, B, or C) and assigned one of a set of colors that cycle through a predefined list.

3. Move and Rotate Boxes:
    - Click and drag boxes to reposition them on the grid.
    - With a box selected, press the 'r' key to rotate is 90°.
    - Boxes will snap to the grid for precise alignment.

Building and Calculating Equations

1. Construct an Equation:
    - Use the interactive equation bar at the top.
    - You can click the provided buttons to build your equation.
    - Try out different equations! A window will appear if an equation is not supported.
    - Supported formats include:
        - Single event: P(A)
        - Intersection/Union: P(AUB)
        - Conditional: P(A|B)
        - Compound Conditional: P(AUB|C)
        - Complements: P(A^c)
        - Compound Complements: P((AUB)^c)


2. Calculate the results.
    - Click the 'Calculate' button.
    - The app will then highlight the grid cells corresponding to the event defined by your equation
    - In conditional expressions, the "given" box (condition) will have a bold border for clarity.
    - The result will be displayed as (Highlighted Grid Cells/Total Grid Cells)

3. Removing highlights
    - To clear the highlighted dots and reset any bolded condition boxes, click the 'Remove Highlights' button.

4. Clear Grid:
    - If you wish to start over (clear all boxes and reset the equation bar), click the 'Clear Grid' button.
    - The grid remains, but the size of the grid can be editied.

--------------------------------------------------------------------------------------------------

**Technical Details**

Front-End:

- The app uses HTML, CSS, and JavaScript to create an interactive grid and equation interface. The grid is generated dynamically based on user input and styled using CSS Grid. 

Back-End:

- A minimal Flask aplication (app.py) serves the web pages. The app routes the main page and serves the static assets (CSS and JavaScript). 

Deployment: 

- The project is hosted on PythonAnywhere, and its source code is maintained on GitHub.

Version Control:

- The code is version-controlled with Git and is available publicly for review and contributions. 

--------------------------------------------------------------------------------------------------

**Contact**

If you have questions or need support, please open an issue in the GitHub repository or contact me at anderson.colburn@apps.schoolcraft.edu.
   
   




import "./style.css";

const APP_NAME = "Draw-Me-Out";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

//create a canvas element
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;

canvas.classList.add("styled-canvas");


app.appendChild(canvas);

// Create control buttons (Clear, Undo, Redo)
const clearButton = document.createElement("button");
clearButton.innerText = "Clear";
clearButton.classList.add("clear-button");

const undoButton = document.createElement("button");
undoButton.innerText = "Undo";
undoButton.classList.add("undo-button");

const redoButton = document.createElement("button");
redoButton.innerText = "Redo";
redoButton.classList.add("redo-button");

// Tool buttons for "Thin" and "Thick"
const thinButton = document.createElement("button");
thinButton.innerText = "Thin Marker";
thinButton.classList.add("thin-button", "selectedTool"); // Initially selected

const thickButton = document.createElement("button");
thickButton.innerText = "Thick Marker";
thickButton.classList.add("thick-button");

// Append the buttons to the app div
app.appendChild(thinButton);
app.appendChild(thickButton);

// State variables for the drawing logic
let currentThickness = 2; // Default thickness for "thin"
const displayList: Array<{ display(ctx: CanvasRenderingContext2D): void }> = [];
const redoStack: Array<{ display(ctx: CanvasRenderingContext2D): void }> = [];

// Class to represent a marker line
class MarkerLine {
  private points: Array<{ x: number, y: number }> = [];
  private thickness: number;

  constructor(initialX: number, initialY: number, thickness: number) {
    this.points.push({ x: initialX, y: initialY });
    this.thickness = thickness;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.lineWidth = this.thickness; // Set line thickness
      ctx.stroke();
    }
  }
}

// Function to enable drawing on the canvas
function enableDrawing(canvas: HTMLCanvasElement) {
  let currentLine: MarkerLine | null = null;
  let isDrawing = false;

  const startDrawing = (event: MouseEvent) => {
    isDrawing = true;
    currentLine = new MarkerLine(event.offsetX, event.offsetY, currentThickness);
    displayList.push(currentLine); // Add the current line to the display list
  };

  const dragDrawing = (event: MouseEvent) => {
    if (!isDrawing || !currentLine) return;
    currentLine.drag(event.offsetX, event.offsetY);

    // Dispatch the custom "drawing-changed" event
    const drawingChangedEvent = new CustomEvent("drawing-changed");
    canvas.dispatchEvent(drawingChangedEvent);
  };

  const stopDrawing = () => {
    isDrawing = false;
    currentLine = null;
    redoStack.length = 0; // Clear redo stack whenever a new path is drawn
  };

  // Event listeners for mouse events
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", dragDrawing);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseout", stopDrawing); // Stop drawing if mouse leaves the canvas
}

// Function to clear and redraw the canvas based on stored objects
function redrawCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

  for (const drawable of displayList) {
    drawable.display(ctx); // Call the display method of each object
  }
}

// Add observer for the "drawing-changed" event
canvas.addEventListener("drawing-changed", () => {
  redrawCanvas(canvas);
});

// Enable drawing on the canvas
enableDrawing(canvas);

// Add event listener to the "Clear" button to clear the canvas and reset paths
clearButton.addEventListener("click", () => {
  const ctx = canvas.getContext("2d");
  if (ctx) {
    displayList.length = 0; // Clear the stored objects
    redoStack.length = 0; // Clear the redo stack
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  }
});

// Add event listener for "Undo" button
undoButton.addEventListener("click", () => {
  if (displayList.length > 0) {
    const lastLine = displayList.pop(); // Remove the last drawable object
    if (lastLine) {
      redoStack.push(lastLine); // Add it to the redo stack
    }

    // Dispatch the custom "drawing-changed" event
    const drawingChangedEvent = new CustomEvent("drawing-changed");
    canvas.dispatchEvent(drawingChangedEvent);
  }
});

// Add event listener for "Redo" button
redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const redoLine = redoStack.pop(); // Remove the last drawable object from redo stack
    if (redoLine) {
      displayList.push(redoLine); // Add it back to the display list
    }

    // Dispatch the custom "drawing-changed" event
    const drawingChangedEvent = new CustomEvent("drawing-changed");
    canvas.dispatchEvent(drawingChangedEvent);
  }
});

// Add event listener for "Thin" tool button
thinButton.addEventListener("click", () => {
  currentThickness = 2; // Set thin line thickness
  thinButton.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");
});

// Add event listener for "Thick" tool button
thickButton.addEventListener("click", () => {
  currentThickness = 8; // Set thick line thickness
  thickButton.classList.add("selectedTool");
  thinButton.classList.remove("selectedTool");
});
Explanation:

// Append the buttons to the app div
app.appendChild(clearButton);
app.appendChild(undoButton);
app.appendChild(redoButton);





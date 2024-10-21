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
let isDrawing = false;
const displayList: Array<{ display(ctx: CanvasRenderingContext2D): void }> = [];
const redoStack: Array<{ display(ctx: CanvasRenderingContext2D): void }> = [];

// New array to hold placed emojis and custom stickers
const stickerList: Array<{ sticker: string; x: number; y: number }> = [];

let toolPreview: ToolPreview | null = null;

// Class to represent a marker line
class MarkerLine {
  private points: Array<{ x: number; y: number }> = [];
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

class ToolPreview {
  private x: number;
  private y: number;
  private thickness: number;

  constructor(x: number, y: number, thickness: number) {
    this.x = x;
    this.y = y;
    this.thickness = thickness;
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  updateThickness(thickness: number) {
    this.thickness = thickness; // Update the thickness when switching tools
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.thickness / 2, 0, 2 * Math.PI);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "gray";
    ctx.stroke();
  }
}

// Function to enable drawing on the canvas
function enableDrawing(canvas: HTMLCanvasElement) {
  let currentLine: MarkerLine | null = null;

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
    stickerList.length = 0; // Clear the sticker list
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

  if (toolPreview) {
    toolPreview.updateThickness(currentThickness); // Update the preview thickness
  }
});

// Add event listener for "Thick" tool button
thickButton.addEventListener("click", () => {
  currentThickness = 8; // Set thick line thickness
  thickButton.classList.add("selectedTool");
  thinButton.classList.remove("selectedTool");

  if (toolPreview) {
    toolPreview.updateThickness(currentThickness); // Update the preview thickness
  }
});

canvas.addEventListener("mousemove", (event: MouseEvent) => {
  if (!isDrawing) {
    if (!toolPreview) {
      toolPreview = new ToolPreview(event.offsetX, event.offsetY, currentThickness);
    } else {
      toolPreview.updatePosition(event.offsetX, event.offsetY);
    }

    // Dispatch the custom "drawing-changed" event
    const toolMovedEvent = new CustomEvent("drawing-changed");
    canvas.dispatchEvent(toolMovedEvent);
  }
});

// Append the buttons to the app div
app.appendChild(clearButton);
app.appendChild(undoButton);
app.appendChild(redoButton);

// Add emoji and sticker selection
const stickers = ["😀", "❤️", "🌟"]; // Example emojis
const emojiButtons: HTMLButtonElement[] = [];

// Create emoji buttons
stickers.forEach((sticker) => {
  const stickerButton = document.createElement("button");
  stickerButton.innerText = sticker;
  stickerButton.classList.add("sticker-button");
  app.appendChild(stickerButton);
  emojiButtons.push(stickerButton);
});

// State variable to track selected sticker
let selectedSticker: string | null = null;

// Add event listeners to emoji buttons
emojiButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    selectedSticker = stickers[index]; // Set selected emoji
    console.log(`Selected sticker: ${selectedSticker}`); // For debugging
  });
});

// Add button to create a custom sticker
const customStickerButton = document.createElement("button");
customStickerButton.innerText = "Create Custom Sticker";
customStickerButton.classList.add("custom-sticker-button");
app.appendChild(customStickerButton);

// Event listener for creating custom stickers
customStickerButton.addEventListener("click", () => {
  const userInput = prompt("Enter your custom sticker:", "🎨");
  if (userInput) {
    stickers.push(userInput); // Add the new sticker to the sticker list
    const customButton = document.createElement("button");
    customButton.innerText = userInput;
    customButton.classList.add("sticker-button");
    app.appendChild(customButton);
    emojiButtons.push(customButton);

    // Add event listener to new custom button
    customButton.addEventListener("click", () => {
      selectedSticker = userInput;
      console.log(`Selected sticker: ${selectedSticker}`); // For debugging
    });
  }
});

// Function to draw the selected sticker on canvas
function drawSticker(ctx: CanvasRenderingContext2D, x: number, y: number) {
  if (selectedSticker) {
    stickerList.push({ sticker: selectedSticker, x, y }); // Store sticker and position
  }
}

// Update the canvas redrawing logic
function redrawCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

    // Draw stored lines
    displayList.forEach((item) => {
      item.display(ctx);
    });

    // Draw stickers
    stickerList.forEach((item) => {
      ctx.font = "24px Arial"; // Adjust font size as needed
      ctx.fillText(item.sticker, item.x, item.y); // Draw each sticker at stored position
    });

    // Draw the tool preview if it exists
    toolPreview?.display(ctx);
  }
}

// Handle drawing stickers on mouse click
canvas.addEventListener("click", (event: MouseEvent) => {
  if (selectedSticker) {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      drawSticker(ctx, event.offsetX, event.offsetY); // Draw sticker at click position

      // Dispatch the custom "drawing-changed" event
      const drawingChangedEvent = new CustomEvent("drawing-changed");
      canvas.dispatchEvent(drawingChangedEvent);
    }
  }
});

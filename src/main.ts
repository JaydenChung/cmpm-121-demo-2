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
const displayList: Array<{ 
  display(ctx: CanvasRenderingContext2D): void, 
  type?: 'line' | 'sticker' 
}> = [];
const redoStack: Array<{ 
  display(ctx: CanvasRenderingContext2D): void, 
  type?: 'line' | 'sticker' 
}> = [];
// New array to hold placed emojis and custom stickers
const stickerList: Array<{ sticker: string; x: number; y: number }> = [];

let toolPreview: ToolPreview | null = null;

// Class to represent a marker line
class MarkerLine {
  private points: Array<{ x: number, y: number }> = [];
  private thickness: number;
  private color: string;
  public type: 'line' = 'line';

  constructor(initialX: number, initialY: number, thickness: number, color: string) {
    this.points.push({ x: initialX, y: initialY });
    this.thickness = thickness;
    this.color = color;
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
      ctx.lineWidth = this.thickness;
      ctx.strokeStyle = this.color;
      ctx.stroke();
    }
  }
}

class Sticker {
  public type: 'sticker' = 'sticker';
  constructor(
      public sticker: string, 
      public x: number, 
      public y: number
  ) {}

  display(ctx: CanvasRenderingContext2D) {
      ctx.font = "24px Arial";
      ctx.fillText(this.sticker, this.x, this.y);
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
      currentLine = new MarkerLine(event.offsetX, event.offsetY, currentThickness, currentColor);
      displayList.push(currentLine);
      redoStack.length = 0; // Clear redo stack
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
    displayList.length = 0;
    redoStack.length = 0;
    stickerList.length = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dispatch the custom "drawing-changed" event
    const drawingChangedEvent = new CustomEvent("drawing-changed");
    canvas.dispatchEvent(drawingChangedEvent);
  }
});

// Add event listener for "Undo" button
undoButton.addEventListener("click", () => {
  if (displayList.length > 0) {
    const lastItem = displayList.pop();
    if (lastItem) {
      redoStack.push(lastItem);

      // Remove the last item from stickerList if it's a sticker
      if (lastItem.type === 'sticker' && stickerList.length > 0) {
        stickerList.pop();
      }

      // Dispatch the custom "drawing-changed" event
      const drawingChangedEvent = new CustomEvent("drawing-changed");
      canvas.dispatchEvent(drawingChangedEvent);
    }
  }
});

// Add event listener for "Redo" button
redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const redoItem = redoStack.pop();
    if (redoItem) {
      displayList.push(redoItem);

      // Add back to stickerList if it's a sticker
      if (redoItem.type === 'sticker') {
        const stickerItem = redoItem as Sticker;
        stickerList.push({ 
          sticker: stickerItem.sticker, 
          x: stickerItem.x, 
          y: stickerItem.y 
        });
      }

      // Dispatch the custom "drawing-changed" event
      const drawingChangedEvent = new CustomEvent("drawing-changed");
      canvas.dispatchEvent(drawingChangedEvent);
    }
  }
});

// Function to get a random color
function getRandomColor() {
    const colors = ["black", "red", "blue", "green", "yellow", "purple", "orange"];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  // Add event listener for "Thin" tool button
  thinButton.addEventListener("click", () => {
    currentThickness = 2; // Set thin line thickness
    currentColor = getRandomColor(); // Set a random color
    thinButton.classList.add("selectedTool");
    thickButton.classList.remove("selectedTool");
  
    // Reset sticker selection when switching to drawing tool
    selectedSticker = null;
    emojiPreview = null;
  
    if (toolPreview) {
      toolPreview.updateThickness(currentThickness); // Update the preview thickness
    }
  });
  
  // Add similar reset for thick button
  thickButton.addEventListener("click", () => {
    currentThickness = 8; // Set thick line thickness
    currentColor = getRandomColor(); // Set a random color
    thickButton.classList.add("selectedTool");
    thinButton.classList.remove("selectedTool");
  
    // Reset sticker selection when switching to drawing tool
    selectedSticker = null;
    emojiPreview = null;
  
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
    // Remove selected class from all emoji buttons
    emojiButtons.forEach(btn => btn.classList.remove('selected-sticker'));
    
    // Add selected class to the clicked button
    button.classList.add('selected-sticker');

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
      // Remove selected class from all emoji buttons
      emojiButtons.forEach(btn => btn.classList.remove('selected-sticker'));
      
      // Add selected class to the clicked button
      customButton.classList.add('selected-sticker');

      selectedSticker = userInput;
      console.log(`Selected sticker: ${selectedSticker}`); // For debugging
    });
  }
});

const styleTag = document.createElement('style');
styleTag.textContent = `
  .selected-sticker {
    border: 2px solid blue;
    background-color: lightblue;
  }
`;
document.head.appendChild(styleTag);

function drawSticker(ctx: CanvasRenderingContext2D, x: number, y: number) {
  if (selectedSticker) {
    const newSticker = new Sticker(selectedSticker, x, y);
    displayList.push(newSticker);
    stickerList.push({ sticker: selectedSticker, x, y });
  }
}

// Update the canvas redrawing logic
// Add a new property to track the emoji preview
let emojiPreview: { sticker: string; x: number; y: number } | null = null;

// Modify the canvas mousemove event listener to handle emoji preview
canvas.addEventListener("mousemove", (event: MouseEvent) => {
  if (!isDrawing) {
    // Handle tool preview for drawing
    if (!toolPreview) {
      toolPreview = new ToolPreview(event.offsetX, event.offsetY, currentThickness);
    } else {
      toolPreview.updatePosition(event.offsetX, event.offsetY);
    }

    // Handle emoji preview if a sticker is selected
    if (selectedSticker) {
      emojiPreview = {
        sticker: selectedSticker,
        x: event.offsetX,
        y: event.offsetY
      };
    } else {
      emojiPreview = null;
    }

    // Dispatch the custom "drawing-changed" event
    const toolMovedEvent = new CustomEvent("drawing-changed");
    canvas.dispatchEvent(toolMovedEvent);
  }
});

// Update the redrawCanvas function to include emoji preview
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

    // Draw emoji preview with reduced opacity
    if (emojiPreview) {
      ctx.globalAlpha = 0.5; // Set reduced opacity for preview
      ctx.font = "24px Arial";
      ctx.fillText(emojiPreview.sticker, emojiPreview.x, emojiPreview.y);
      ctx.globalAlpha = 1; // Reset opacity
    }
  }
}

// Handle drawing stickers on mouse click
canvas.addEventListener("click", (event: MouseEvent) => {
  if (selectedSticker) {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      drawSticker(ctx, event.offsetX, event.offsetY);
      redoStack.length = 0; // Clear redo stack when placing a sticker

      // Dispatch the custom "drawing-changed" event
      const drawingChangedEvent = new CustomEvent("drawing-changed");
      canvas.dispatchEvent(drawingChangedEvent);
    }
  }
});

// Add an "Export" button
const exportButton = document.createElement("button");
exportButton.innerText = "Export as PNG";
exportButton.classList.add("export-button");
app.appendChild(exportButton);

// Event listener for the export button
exportButton.addEventListener("click", () => {
  // Step 1: Create a temporary canvas of size 1024x1024
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext("2d");

  if (exportCtx) {
    // Step 2: Scale the context to 4x in both dimensions
    exportCtx.scale(4, 4); // Scale up by 4x

    // Step 3: Redraw all the items from the display list on the new context
    displayList.forEach((item) => {
      item.display(exportCtx);
    });

    // Draw stickers on the new canvas
    stickerList.forEach((item) => {
      exportCtx.font = "24px Arial"; // Keep font size the same as the original
      exportCtx.fillText(item.sticker, item.x, item.y); // Draw stickers at stored positions
    });

    // Step 4: Convert the canvas content to a PNG file and trigger download
    exportCanvas.toBlob((blob) => {
      if (blob) {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "drawing_export.png"; // Set the filename
        link.click(); // Trigger the download
      }
    }, "image/png"); // PNG format
  }
});


// Add color selection buttons
const colors = ["black", "red", "blue", "green"]; // Example colors
const colorButtons: HTMLButtonElement[] = [];
let currentColor = "black"; // Default color

// Create color buttons
colors.forEach((color) => {
  const colorButton = document.createElement("button");
  colorButton.innerText = color;
  colorButton.style.backgroundColor = color;
  colorButton.classList.add("color-button");
  app.appendChild(colorButton);
  colorButtons.push(colorButton);
});

// Add event listeners to color buttons
colorButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    currentColor = colors[index]; // Set the current color when a button is clicked
    console.log(`Selected color: ${currentColor}`); // For debugging
  });
});


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

// Store the drawing paths (array of arrays of points)
const paths: Array<Array<{ x: number, y: number }>> = [];

// Function to enable capturing of points and dispatch event
function enableDrawing(canvas: HTMLCanvasElement) {
  let currentPath: Array<{ x: number, y: number }> = [];
  let isDrawing = false;

  const startDrawing = (event: MouseEvent) => {
    isDrawing = true;
    currentPath = [];
    paths.push(currentPath); // Start a new path
    addPoint(event);
  };

  const addPoint = (event: MouseEvent) => {
    if (!isDrawing) return;
    const point = { x: event.offsetX, y: event.offsetY };
    currentPath.push(point);

    // Dispatch the custom "drawing-changed" event after adding a point
    const drawingChangedEvent = new CustomEvent("drawing-changed");
    canvas.dispatchEvent(drawingChangedEvent);
  };

  const stopDrawing = () => {
    isDrawing = false;
  };

  // Event listeners for mouse events
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", addPoint);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseout", stopDrawing); // Stop drawing if mouse leaves the canvas
}

// Function to clear and redraw the canvas based on stored points
function redrawCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

  ctx.beginPath(); // Start a new path for drawing
  for (const path of paths) {
    if (path.length > 0) {
      ctx.moveTo(path[0].x, path[0].y); // Move to the first point
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y); // Draw a line to each subsequent point
      }
    }
  }
  ctx.stroke(); // Apply the stroke to render the paths
}

// Add observer for the "drawing-changed" event
canvas.addEventListener("drawing-changed", () => {
  redrawCanvas(canvas);
});

enableDrawing(canvas);

//create clear button
const button = document.createElement("button");
button.innerText = "CLEAR"

app.appendChild(button);

// Add event listener to the "Clear" button to clear the canvas
button.addEventListener("click", () => {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clears the entire canvas
    }
  });




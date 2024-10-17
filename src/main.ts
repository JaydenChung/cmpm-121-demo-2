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

// Function to enable drawing on the canvas
const enableDrawing = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
  
    let isDrawing = false;
  
    const startDrawing = (event: MouseEvent) => {
      isDrawing = true;
      ctx.beginPath(); // Start a new path
      ctx.moveTo(event.offsetX, event.offsetY); // Move to the mouse position
    };
  
    const draw = (event: MouseEvent) => {
      if (!isDrawing) return;
      ctx.lineTo(event.offsetX, event.offsetY); // Draw line to the current mouse position
      ctx.stroke(); // Apply the stroke to the canvas
    };
  
    const stopDrawing = () => {
      isDrawing = false;
      ctx.closePath(); // Close the path when done drawing
    };
  
    // Event listeners for mouse events
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing); // Stop drawing if mouse leaves the canvas
  };

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




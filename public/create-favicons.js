// A simple script to create basic favicons for the Vibe app
// This needs to be run in a browser environment because it uses canvas

// Create a canvas element
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

// Function to create a favicon
function createFavicon(size) {
  // Set canvas size
  canvas.width = size;
  canvas.height = size;
  
  const ctx = canvas.getContext('2d');
  
  // Background with blue gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#38bdf8');
  gradient.addColorStop(1, '#0284c7');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Add a 'V' letter
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = size * 0.15;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  ctx.beginPath();
  ctx.moveTo(size * 0.3, size * 0.25);
  ctx.lineTo(size * 0.5, size * 0.75);
  ctx.lineTo(size * 0.7, size * 0.25);
  ctx.stroke();
  
  // Return data URL
  return canvas.toDataURL('image/png');
}

// Create and download favicons
['favicon.ico', 'icons/icon-16x16.png', 'icons/icon-32x32.png'].forEach((filename, index) => {
  const size = index === 0 ? 32 : (index === 1 ? 16 : 32);
  const dataURL = createFavicon(size);
  
  // Create download link
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  link.textContent = `Download ${filename}`;
  link.style.display = 'block';
  link.style.marginBottom = '10px';
  document.body.appendChild(link);
});

// Cleanup
setTimeout(() => {
  document.body.removeChild(canvas);
}, 1000);

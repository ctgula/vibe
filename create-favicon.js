const fs = require('fs');
const path = require('path');

// Simple pixel data for a 16x16 blue square with a "V" shape
// Each pixel is represented by 4 bytes (RGBA)
function generateFaviconData() {
  // Create a 16x16 buffer (4 bytes per pixel)
  const faviconBuffer = Buffer.alloc(16 * 16 * 4);
  
  // Fill with blue color #38bdf8
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const offset = (y * 16 + x) * 4;
      
      // Default blue color
      faviconBuffer[offset] = 0x38;     // R
      faviconBuffer[offset + 1] = 0xbd; // G
      faviconBuffer[offset + 2] = 0xf8; // B
      faviconBuffer[offset + 3] = 0xff; // A
      
      // Add a simple white "V" shape
      const inVShape = 
        (x >= y/2 && x < 8 && y > 3 && y < 12) || // Left side of V
        (x < 16-y/2 && x >= 8 && y > 3 && y < 12); // Right side of V
        
      if (inVShape) {
        faviconBuffer[offset] = 0xff;     // R
        faviconBuffer[offset + 1] = 0xff; // G
        faviconBuffer[offset + 2] = 0xff; // B
      }
    }
  }
  
  return faviconBuffer;
}

// Create a very basic .ico structure
function createIcoFile() {
  // ICO header: 6 bytes
  // 0-1: Reserved (0)
  // 2-3: Type (1 for ICO)
  // 4-5: Number of images (1)
  const header = Buffer.from([0, 0, 1, 0, 1, 0]);
  
  // Directory entry: 16 bytes
  // 0: Width (16)
  // 1: Height (16)
  // 2: Color palette (0 for no color palette)
  // 3: Reserved (0)
  // 4-5: Color planes (1)
  // 6-7: Bits per pixel (32)
  // 8-11: Size of the image data (16*16*4 = 1024 bytes)
  // 12-15: Offset where the bitmap data starts (header size + directory size = 6 + 16 = 22)
  const imageSize = 16 * 16 * 4;
  const directory = Buffer.alloc(16);
  directory[0] = 16;  // Width
  directory[1] = 16;  // Height
  directory[2] = 0;   // Color palette
  directory[3] = 0;   // Reserved
  directory.writeUInt16LE(1, 4);  // Color planes
  directory.writeUInt16LE(32, 6); // Bits per pixel
  directory.writeUInt32LE(imageSize, 8); // Image size
  directory.writeUInt32LE(22, 12); // Offset
  
  // Image data (very basic RGBA data for a 16x16 image)
  const imageData = generateFaviconData();
  
  // Combine all parts
  return Buffer.concat([header, directory, imageData]);
}

// Write the ico file
const faviconData = createIcoFile();
const publicPath = path.join(__dirname, 'public');
const faviconPath = path.join(publicPath, 'favicon.ico');

fs.writeFileSync(faviconPath, faviconData);
console.log(`Favicon created at ${faviconPath}`);

// Also create small PNG versions for the icons folder
// (This is a very basic implementation without proper PNG encoding)
const smallIconPath = path.join(publicPath, 'icons', 'icon-16x16.png');
const mediumIconPath = path.join(publicPath, 'icons', 'icon-32x32.png');

// Ensure the icons directory exists
const iconsDir = path.join(publicPath, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// For this example, we'll just copy the favicon.ico to these locations
// In a real implementation, you'd want to create proper PNG files
fs.copyFileSync(faviconPath, smallIconPath);
fs.copyFileSync(faviconPath, mediumIconPath);

console.log(`Small icon created at ${smallIconPath}`);
console.log(`Medium icon created at ${mediumIconPath}`);

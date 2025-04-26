// Simple Node.js script to generate PWA icons from a template
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ICON_SIZES = [
  72, 96, 128, 144, 152, 167, 180, 192, 384, 512
];

// Create an icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a special Apple Touch icon
console.log('Creating Apple Touch icon...');
const appleTouchIconPath = path.join(iconsDir, 'apple-touch-icon.png');
exec(`npx svg-to-png public/icons/icon-template.svg -o public/icons -w 180 -h 180 -n apple-touch-icon.png`, (err) => {
  if (err) {
    console.error('Error creating Apple Touch icon:', err);
  } else {
    console.log('Created Apple Touch icon');
  }
});

// Generate each icon size
ICON_SIZES.forEach(size => {
  console.log(`Creating icon-${size}x${size}.png...`);
  const iconPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  
  exec(`npx svg-to-png public/icons/icon-template.svg -o public/icons -w ${size} -h ${size} -n icon-${size}x${size}.png`, (err) => {
    if (err) {
      console.error(`Error creating icon-${size}x${size}.png:`, err);
    } else {
      console.log(`Created icon-${size}x${size}.png`);
    }
  });
});

console.log('Icon generation process started. This may take a moment...');

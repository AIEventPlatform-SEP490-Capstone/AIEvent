const sizeOf = require('image-size');
const path = require('path');

// Check dimensions of icon.png
const imagePath = path.join(__dirname, 'src', 'assets', 'images', 'icon.png');
try {
  const dimensions = sizeOf(imagePath);
  console.log(`icon.png dimensions: ${dimensions.width}x${dimensions.height}`);
} catch (error) {
  console.error('Error checking image dimensions:', error.message);
}

// Check dimensions of AIEventLogo.png
const logoPath = path.join(__dirname, 'src', 'assets', 'images', 'AIEventLogo.png');
try {
  const dimensions = sizeOf(logoPath);
  console.log(`AIEventLogo.png dimensions: ${dimensions.width}x${dimensions.height}`);
} catch (error) {
  console.error('Error checking image dimensions:', error.message);
}
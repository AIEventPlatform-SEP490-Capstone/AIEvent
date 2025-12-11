const probe = require('probe-image-size');
const fs = require('fs');

async function checkImageDimensions() {
  try {
    // Check dimensions of icon.png
    const iconBuffer = fs.readFileSync('./src/assets/images/icon.png');
    const iconResult = probe.sync(iconBuffer);
    console.log(`icon.png dimensions: ${iconResult.width}x${iconResult.height}`);
    
    // Check dimensions of AIEventLogo.png
    const logoBuffer = fs.readFileSync('./src/assets/images/AIEventLogo.png');
    const logoResult = probe.sync(logoBuffer);
    console.log(`AIEventLogo.png dimensions: ${logoResult.width}x${logoResult.height}`);
  } catch (error) {
    console.error('Error checking image dimensions:', error.message);
  }
}

checkImageDimensions();
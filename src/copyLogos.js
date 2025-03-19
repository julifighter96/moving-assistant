const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Source logo path
const sourceLogoPath = path.join(__dirname, 'assets', 'images', 'Riedlin-Logo-512px_Neu.webp');

// Target sizes and filenames
const targets = [
  { size: 64, name: 'favicon.ico', format: 'ico' },
  { size: 192, name: 'logo192.png', format: 'png' },
  { size: 512, name: 'logo512.png', format: 'png' },
  { size: 192, name: 'maskable_icon.png', format: 'png' }
];

// Create resized versions of the logo
async function createLogos() {
  try {
    if (!fs.existsSync(sourceLogoPath)) {
      console.error(`Source logo not found at: ${sourceLogoPath}`);
      return;
    }

    console.log('Creating logo files...');
    
    for (const target of targets) {
      const outputPath = path.join(__dirname, '..', 'public', target.name);
      
      if (target.format === 'ico') {
        // For ICO format (favicon)
        await sharp(sourceLogoPath)
          .resize(target.size, target.size)
          .toFormat('png')
          .toFile(outputPath.replace('.ico', '.png'));
          
        console.log(`Created ${target.name} (${target.size}x${target.size})`);
      } else {
        // For PNG format
        await sharp(sourceLogoPath)
          .resize(target.size, target.size)
          .toFormat('png')
          .toFile(outputPath);
          
        console.log(`Created ${target.name} (${target.size}x${target.size})`);
      }
    }
    
    console.log('All logo files created successfully');
  } catch (error) {
    console.error('Error creating logos:', error);
  }
}

createLogos(); 
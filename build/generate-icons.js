import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const svgPath = join(__dirname, 'icon.svg');
const svgBuffer = readFileSync(svgPath);

async function generateIcons() {
  console.log('Generating icon files...\n');
  
  // Generate PNG at various sizes
  const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];
  
  for (const size of sizes) {
    const outputPath = join(__dirname, `icon-${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated: icon-${size}.png`);
  }
  
  // Generate main icon.png (512x512)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(join(__dirname, 'icon.png'));
  console.log(`✓ Generated: icon.png (512x512)\n`);
  
  console.log('Icons generated successfully!');
  console.log('\nNext steps:');
  console.log('1. Install electron-icon-maker: npm install --save-dev electron-icon-maker');
  console.log('2. Generate .ico and .icns: npx electron-icon-maker --input=./build/icon-1024.png --output=./build');
  console.log('\nOr the icons are ready to use as-is for development!');
}

generateIcons().catch(console.error);


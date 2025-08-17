import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');

// Create directories if they don't exist
const createDirIfNotExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Function to create a modified SVG with explicit colors
const createColorFixedSvg = (inputPath, tempPath) => {
  // Read SVG file content
  const svgContent = fs.readFileSync(inputPath, 'utf8');
  
  // Create a modified SVG that uses explicit colors instead of OKLCH
  const modifiedSvg = svgContent
    // Replace the gradient definitions with explicit colors
    .replace(/<linearGradient[\s\S]*?<\/linearGradient>/g, `<linearGradient id="brand" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#006239"/>
      <stop offset="1" stop-color="#004d2d"/>
    </linearGradient>`)
    // Remove CSS variables and media queries
    .replace(/<style>[\s\S]*?<\/style>/g, '');
  
  // Write the modified SVG to a temporary file
  fs.writeFileSync(tempPath, modifiedSvg);
  
  return tempPath;
};

// Convert SVG to ICO (using PNG with .ico extension)
const convertToIco = async (inputPath, outputPath, size = 32) => {
  try {
    const inputExt = path.extname(inputPath).toLowerCase();
    
    if (inputExt === '.svg') {
      // Create a temp directory if it doesn't exist
      const tempDir = path.join(__dirname, '..', 'temp');
      createDirIfNotExists(tempDir);
      
      // Create a temporary SVG with fixed colors
      const tempSvgPath = path.join(tempDir, `${path.basename(inputPath, '.svg')}_fixed.svg`);
      createColorFixedSvg(inputPath, tempSvgPath);
      
      // Convert the fixed SVG
      await sharp(tempSvgPath, { density: 600 }) // Higher density for better SVG rendering
        .resize(size, size)
        .ensureAlpha()
        .png({ quality: 100 })
        .toFile(outputPath);
        
      // Clean up temp file
      try { fs.unlinkSync(tempSvgPath); } catch (e) {}
    } else {
      // For non-SVG inputs
      await sharp(inputPath)
        .resize(size, size)
        .ensureAlpha()
        .png({ quality: 100 })
        .toFile(outputPath);
    }
    
    console.log(`✅ Converted ${path.basename(inputPath)} to ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`❌ Error converting ${inputPath} to ICO:`, error);
  }
};

// Convert SVG to PNG
const convertToPng = async (inputPath, outputPath, width, height) => {
  try {
    const inputExt = path.extname(inputPath).toLowerCase();
    
    if (inputExt === '.svg') {
      // Create a temp directory if it doesn't exist
      const tempDir = path.join(__dirname, '..', 'temp');
      createDirIfNotExists(tempDir);
      
      // Create a temporary SVG with fixed colors
      const tempSvgPath = path.join(tempDir, `${path.basename(inputPath, '.svg')}_fixed.svg`);
      createColorFixedSvg(inputPath, tempSvgPath);
      
      // Convert the fixed SVG
      await sharp(tempSvgPath, { density: 600 }) // Higher density for better SVG rendering
        .resize(width, height)
        .png({ quality: 100 })
        .toFile(outputPath);
        
      // Clean up temp file
      try { fs.unlinkSync(tempSvgPath); } catch (e) {}
    } else {
      // For non-SVG inputs
      await sharp(inputPath)
        .resize(width, height)
        .png({ quality: 100 })
        .toFile(outputPath);
    }
    
    console.log(`✅ Converted ${path.basename(inputPath)} to ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`❌ Error converting ${inputPath} to PNG:`, error);
  }
};

// Main function
const main = async () => {
  console.log('Starting image conversion...');
  
  // Ensure output directories exist
  const outputDir = path.join(publicDir, 'converted');
  createDirIfNotExists(outputDir);

  // Conversion tasks
  const conversions = [
    // Favicon
    {
      input: path.join(publicDir, 'fixed-favicon.svg'),
      output: path.join(publicDir, 'favicon.ico'),
      type: 'ico',
      size: 32
    },
    // Logo 192
    {
      input: path.join(publicDir, 'fixed-logo192.svg'),
      output: path.join(publicDir, 'logo192.png'),
      type: 'png',
      width: 192,
      height: 192
    },
    // Logo 512
    {
      input: path.join(publicDir, 'fixed-logo512.svg'),
      output: path.join(publicDir, 'logo512.png'),
      type: 'png',
      width: 512,
      height: 512
    }
  ];

  // Process all conversions
  for (const task of conversions) {
    try {
      if (task.type === 'ico') {
        await convertToIco(task.input, task.output, task.size);
      } else if (task.type === 'png') {
        await convertToPng(task.input, task.output, task.width, task.height);
      }
    } catch (error) {
      console.error(`Error processing ${task.input}:`, error);
    }
  }

  console.log('✅ All conversions completed!');
};

// Run the script
main().catch(console.error);

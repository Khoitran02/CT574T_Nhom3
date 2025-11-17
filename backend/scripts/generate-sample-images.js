/**
 * Generate Sample Images Script
 * Tạo 100 ảnh sample nhỏ (max 1KB) cho posts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SVG patterns for different image types
const svgPatterns = [
  // Nature patterns
  { bg: '#4ade80', shape: 'circle', name: 'nature' },
  { bg: '#22c55e', shape: 'rect', name: 'forest' },
  { bg: '#16a34a', shape: 'polygon', name: 'mountain' },
  
  // Sky patterns
  { bg: '#60a5fa', shape: 'circle', name: 'sky' },
  { bg: '#3b82f6', shape: 'ellipse', name: 'cloud' },
  { bg: '#2563eb', shape: 'path', name: 'sun' },
  
  // Abstract patterns
  { bg: '#f59e0b', shape: 'polygon', name: 'abstract' },
  { bg: '#d97706', shape: 'rect', name: 'geometric' },
  { bg: '#b45309', shape: 'circle', name: 'pattern' },
  
  // Tech patterns
  { bg: '#8b5cf6', shape: 'rect', name: 'tech' },
  { bg: '#7c3aed', shape: 'polygon', name: 'digital' },
  { bg: '#6366f1', shape: 'circle', name: 'code' },
  
  // Food patterns
  { bg: '#ef4444', shape: 'circle', name: 'food' },
  { bg: '#dc2626', shape: 'ellipse', name: 'fruit' },
  { bg: '#f97316', shape: 'rect', name: 'meal' },
  
  // Art patterns
  { bg: '#ec4899', shape: 'polygon', name: 'art' },
  { bg: '#db2777', shape: 'circle', name: 'paint' },
  { bg: '#a855f7', shape: 'rect', name: 'design' },
  
  // Sports patterns
  { bg: '#14b8a6', shape: 'circle', name: 'sports' },
  { bg: '#0d9488', shape: 'polygon', name: 'fitness' },
  { bg: '#06b6d4', shape: 'rect', name: 'active' },
];

function generateSVG(index, pattern) {
  const width = 200;
  const height = 150;
  const { bg, shape, name } = pattern;
  
  let shapeElement = '';
  const color1 = bg;
  const color2 = adjustBrightness(bg, -20);
  
  switch (shape) {
    case 'circle':
      shapeElement = `
        <circle cx="100" cy="75" r="40" fill="${color2}" opacity="0.8"/>
        <circle cx="130" cy="60" r="25" fill="${color1}" opacity="0.6"/>
        <circle cx="70" cy="90" r="30" fill="${color2}" opacity="0.5"/>
      `;
      break;
    case 'rect':
      shapeElement = `
        <rect x="50" y="30" width="60" height="60" fill="${color2}" opacity="0.7" transform="rotate(15 80 60)"/>
        <rect x="100" y="50" width="50" height="50" fill="${color1}" opacity="0.6" transform="rotate(-10 125 75)"/>
        <rect x="70" y="80" width="40" height="40" fill="${color2}" opacity="0.5"/>
      `;
      break;
    case 'polygon':
      shapeElement = `
        <polygon points="100,20 140,70 100,120 60,70" fill="${color2}" opacity="0.7"/>
        <polygon points="130,40 160,80 130,110 100,80" fill="${color1}" opacity="0.6"/>
        <polygon points="70,50 90,80 70,100 50,80" fill="${color2}" opacity="0.5"/>
      `;
      break;
    case 'ellipse':
      shapeElement = `
        <ellipse cx="100" cy="75" rx="60" ry="30" fill="${color2}" opacity="0.7" transform="rotate(20 100 75)"/>
        <ellipse cx="120" cy="60" rx="40" ry="25" fill="${color1}" opacity="0.6" transform="rotate(-15 120 60)"/>
        <ellipse cx="80" cy="90" rx="35" ry="20" fill="${color2}" opacity="0.5"/>
      `;
      break;
    case 'path':
      shapeElement = `
        <path d="M 50 75 Q 100 25, 150 75 T 150 100" fill="none" stroke="${color2}" stroke-width="8" opacity="0.7"/>
        <path d="M 60 80 Q 100 40, 140 80" fill="none" stroke="${color1}" stroke-width="6" opacity="0.6"/>
        <path d="M 70 85 Q 100 55, 130 85" fill="none" stroke="${color2}" stroke-width="4" opacity="0.5"/>
      `;
      break;
  }
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="${bg}"/>
  ${shapeElement}
  <text x="10" y="140" font-family="Arial" font-size="14" fill="#fff" opacity="0.8">${name}-${index}</text>
</svg>`;
}

function adjustBrightness(hexColor, percent) {
  const num = parseInt(hexColor.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1);
}

async function generateSampleImages() {
  console.log('🎨 Generating 100 sample images...\n');
  
  const outputDir = path.join(__dirname, '..', 'public', 'uploads', 'sample-images');
  
  // Create directory if not exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const imageList = [];
  let lastSvg = '';
  
  for (let i = 1; i <= 100; i++) {
    const patternIndex = (i - 1) % svgPatterns.length;
    const pattern = svgPatterns[patternIndex];
    const svg = generateSVG(i, pattern);
    lastSvg = svg;
    const filename = `sample-${String(i).padStart(3, '0')}.svg`;
    const filepath = path.join(outputDir, filename);
    
    fs.writeFileSync(filepath, svg);
    imageList.push(`/uploads/sample-images/${filename}`);
    
    if (i % 10 === 0) {
      console.log(`✅ Generated ${i}/100 images`);
    }
  }
  
  console.log('\n✨ Successfully generated 100 sample images!');
  console.log(`📁 Location: ${outputDir}`);
  console.log(`📊 Average size: ~${Math.round(lastSvg.length / 1024 * 100) / 100}KB per image\n`);
  
  // Create image list file for seeders
  const listFile = path.join(__dirname, 'sample-images-list.json');
  fs.writeFileSync(listFile, JSON.stringify(imageList, null, 2));
  console.log(`📝 Image list saved to: ${listFile}`);
}

generateSampleImages().catch(console.error);

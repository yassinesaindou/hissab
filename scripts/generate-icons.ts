import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = path.join(__dirname, '../public/icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#4f46e5';
  ctx.fillRect(0, 0, size, size);
  
  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.3}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('H', size / 2, size / 2);
  
  // Save
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(publicDir, `icon-${size}x${size}.png`), buffer);
});

console.log('Icons generated successfully!');
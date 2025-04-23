const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const imagesDir = path.join(__dirname, '../public/images');

// Create images directory if it doesn't exist
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Generate stars background
function generateStars() {
  const canvas = createCanvas(1920, 1080);
  const ctx = canvas.getContext('2d');

  // Fill with dark background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw stars
  for (let i = 0; i < 1000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 2;
    const opacity = Math.random();

    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(imagesDir, 'stars.png'), buffer);
  console.log('Generated stars.png');
}

// Generate aurora effect
function generateAurora() {
  const canvas = createCanvas(1920, 1080);
  const ctx = canvas.getContext('2d');

  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
  gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.2)');
  gradient.addColorStop(1, 'rgba(239, 68, 68, 0.1)');

  // Draw aurora
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add some noise
  for (let i = 0; i < 10000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 3;
    const opacity = Math.random() * 0.1;

    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(imagesDir, 'aurora.png'), buffer);
  console.log('Generated aurora.png');
}

// Generate both images
generateStars();
generateAurora(); 
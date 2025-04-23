const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const soundsDir = path.join(__dirname, '../public/sounds');

// Create sounds directory if it doesn't exist
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// Generate portal enter sound (whoosh + chime)
const portalEnterCommand = `
  ffmpeg -f lavfi -i "sine=frequency=1000:duration=0.1" \
  -f lavfi -i "sine=frequency=2000:duration=0.1" \
  -filter_complex "[0:a][1:a]amix=inputs=2:duration=longest" \
  -f lavfi -i "anoisesrc=d=0.5:c=pink:a=0.1" \
  -filter_complex "[2:a]volume=0.5[noise];[0:a][noise]amix=inputs=2:duration=longest" \
  ${path.join(soundsDir, 'portal-enter.mp3')}
`;

// Generate portal hover sound (gentle chime)
const portalHoverCommand = `
  ffmpeg -f lavfi -i "sine=frequency=1500:duration=0.2" \
  -f lavfi -i "sine=frequency=2000:duration=0.2" \
  -filter_complex "[0:a][1:a]amix=inputs=2:duration=longest" \
  ${path.join(soundsDir, 'portal-hover.mp3')}
`;

// Execute commands
exec(portalEnterCommand, (error) => {
  if (error) {
    console.error('Error generating portal enter sound:', error);
    return;
  }
  console.log('Generated portal-enter.mp3');
});

exec(portalHoverCommand, (error) => {
  if (error) {
    console.error('Error generating portal hover sound:', error);
    return;
  }
  console.log('Generated portal-hover.mp3');
}); 
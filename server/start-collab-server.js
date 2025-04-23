const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Check if WSL is available
exec('wsl -l -v', (error, stdout, stderr) => {
  if (error) {
    console.error('WSL is not available:', error);
    console.log('Starting server without WSL...');
    startServer(false);
    return;
  }

  console.log('WSL distributions:');
  console.log(stdout);
  
  // Check if Fluvio is installed in WSL
  exec('wsl which fluvio', (error, stdout, stderr) => {
    if (error) {
      console.error('Fluvio not found in WSL:', error);
      console.log('Starting server without Fluvio WSL integration...');
      startServer(false);
      return;
    }

    console.log('Fluvio found at:', stdout.trim());
    
    // Get WSL IP address
    exec('wsl hostname -I', (error, stdout, stderr) => {
      if (error) {
        console.error('Could not get WSL IP:', error);
        startServer(false);
        return;
      }

      const wslIp = stdout.trim().split(' ')[0];
      console.log('WSL IP address:', wslIp);
      
      // Update .env file with WSL IP
      const envPath = path.resolve(__dirname, '../.env');
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      if (envContent.includes('VITE_FLUVIO_WSL_IP=')) {
        envContent = envContent.replace(/VITE_FLUVIO_WSL_IP=.*/, `VITE_FLUVIO_WSL_IP=${wslIp}`);
      } else {
        envContent += `\nVITE_FLUVIO_WSL_IP=${wslIp}`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log('Updated .env with WSL IP');
      
      // Start Fluvio in WSL if not already running
      checkFluvioStatus();
    });
  });
});

// Check if Fluvio is running in WSL
function checkFluvioStatus() {
  exec('wsl fluvio cluster status', (error, stdout, stderr) => {
    if (stdout.includes('Running')) {
      console.log('Fluvio is already running in WSL');
      startServer(true);
    } else {
      console.log('Starting Fluvio in WSL...');
      startFluvio();
    }
  });
}

// Start Fluvio in WSL
function startFluvio() {
  exec('wsl fluvio cluster start', (error, stdout, stderr) => {
    if (error) {
      console.error('Error starting Fluvio:', error);
      startServer(false);
      return;
    }

    console.log('Fluvio started successfully');
    startServer(true);
  });
}

// Start the collaboration server
function startServer(withFluvio) {
  // Set environment variable for server
  process.env.WITH_FLUVIO = withFluvio ? 'true' : 'false';
  
  console.log(`Starting collaboration server ${withFluvio ? 'with' : 'without'} Fluvio integration...`);
  
  // Start the server
  require('./server.js');
} 
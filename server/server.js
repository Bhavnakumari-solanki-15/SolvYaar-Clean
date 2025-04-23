require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { setupFallbackServer, addCollabRoutes } = require('./fallback-collab-handler');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Math Wizard Collaborative Server',
    fluvio: process.env.WITH_FLUVIO === 'true'
  });
});

// Setup collaborative features
if (process.env.WITH_FLUVIO === 'true') {
  try {
    // We'll require the TS file, assuming ts-node is available or it's been transpiled
    console.log('Setting up collaborative features with Fluvio');
    const { setupCollabServer } = require('./collab-handler');
    setupCollabServer(server);
  } catch (error) {
    console.error('Error setting up collaborative features with Fluvio:', error);
    console.log('Falling back to non-Fluvio implementation');
    setupFallbackServer(server);
    addCollabRoutes(app);
  }
} else {
  console.log('Setting up collaborative features without Fluvio');
  setupFallbackServer(server);
  addCollabRoutes(app);
}

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Fluvio integration: ${process.env.WITH_FLUVIO === 'true' ? 'Enabled' : 'Disabled'}`);
}); 
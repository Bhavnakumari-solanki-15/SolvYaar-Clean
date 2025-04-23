// Initialize WebSocket token
(function() {
  // Generate a random token if one doesn't exist
  if (typeof window.__WS_TOKEN__ === 'undefined') {
    window.__WS_TOKEN__ = 'token_' + Math.random().toString(36).substr(2, 9);
    console.log('WebSocket token initialized:', window.__WS_TOKEN__);
  }
})(); 
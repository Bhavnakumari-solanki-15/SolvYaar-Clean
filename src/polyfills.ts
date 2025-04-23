// Polyfill for process object
if (typeof window !== 'undefined' && !window.process) {
  window.process = {
    env: {},
    platform: 'browser',
    version: 'v16.0.0',
  } as any;
}

// Import this file at the top of your main entry file
export {}; 
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: true,
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  define: {
    'process.env': {
      NODE_ENV: JSON.stringify(mode),
      VITE_SUPABASE_URL: JSON.stringify(process.env.VITE_SUPABASE_URL),
      VITE_SUPABASE_ANON_KEY: JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
      VITE_API_BASE_URL: JSON.stringify(process.env.VITE_API_BASE_URL),
      VITE_FLUVIO_WSL_IP: JSON.stringify(process.env.VITE_FLUVIO_WSL_IP),
    },
    'process.platform': JSON.stringify('browser'),
    'process.version': JSON.stringify('v16.0.0'),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      '@radix-ui/react-tooltip',
      '@radix-ui/react-select',
      '@radix-ui/react-label',
      '@radix-ui/react-progress',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-tabs',
      '@radix-ui/react-separator',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-aspect-ratio',
      'three',
    ],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      // Bundle everything - no externals
      external: [],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: [
            '@radix-ui/react-dialog', 
            '@radix-ui/react-dropdown-menu', 
            '@radix-ui/react-tooltip',
            '@radix-ui/react-select',
            '@radix-ui/react-label',
            '@radix-ui/react-progress',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-tabs',
            '@radix-ui/react-separator',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-aspect-ratio',
            '@radix-ui/react-accordion'
          ],
          three: ['three']
        }
      }
    }
  },
}));

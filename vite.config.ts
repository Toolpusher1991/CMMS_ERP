import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true, // Netzwerk-Zugriff aktiviert (aber keine Mobile-Features)
    port: 5173
  },
  build: {
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-label',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-popover',
            '@radix-ui/react-calendar'
          ],
          'chart-vendor': ['recharts'],
          'excel-vendor': ['exceljs', 'file-saver'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'date-vendor': ['date-fns'],
          'icon-vendor': ['lucide-react'],
          // Large page components
          'action-tracker': ['./src/pages/ActionTracker.tsx'],
          'rig-configurator': ['./src/pages/RigConfigurator.tsx'],
          'failure-reporting': ['./src/pages/FailureReporting.tsx'],
          'inspection-reports': ['./src/pages/InspectionReports.tsx'],
        },
      },
    },
    // Increase chunk size warning limit for large components
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging
    sourcemap: true,
  },
})

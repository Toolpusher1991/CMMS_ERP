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
        manualChunks(id) {
          // Separate vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('recharts')) {
              return 'chart-vendor';
            }
            if (id.includes('exceljs') || id.includes('file-saver')) {
              return 'excel-vendor';
            }
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'form-vendor';
            }
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icon-vendor';
            }
            // Other node_modules go to vendor chunk
            return 'vendor';
          }
          // Large page components
          if (id.includes('/pages/ActionTracker')) {
            return 'action-tracker';
          }
          if (id.includes('/pages/RigConfigurator')) {
            return 'rig-configurator';
          }
          if (id.includes('/pages/FailureReporting')) {
            return 'failure-reporting';
          }
          if (id.includes('/pages/InspectionReports')) {
            return 'inspection-reports';
          }
        },
      },
    },
    // Increase chunk size warning limit for large components
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging
    sourcemap: true,
  },
})

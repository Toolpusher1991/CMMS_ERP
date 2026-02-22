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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React ecosystem
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI framework (Radix + shadcn utilities)
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-tooltip',
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
            'lucide-react',
          ],
          // Charts & flow diagrams (heavy, rarely change)
          'vendor-charts': ['recharts', '@xyflow/react'],
          // Excel/PDF export (loaded on demand)
          'vendor-export': ['xlsx', 'exceljs', 'jspdf', 'jspdf-autotable', 'html-to-image', 'file-saver'],
          // Date utilities
          'vendor-date': ['date-fns', 'react-day-picker'],
          // Drag & drop
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/modifiers', '@dnd-kit/utilities'],
        },
      },
    },
    chunkSizeWarningLimit: 600, // Slightly raise since we're now splitting properly
  },
  server: {
    host: true, // Netzwerk-Zugriff aktiviert (aber keine Mobile-Features)
    port: 5173,
    strictPort: true // Fehler wenn Port belegt, nicht automatisch wechseln
  }
})

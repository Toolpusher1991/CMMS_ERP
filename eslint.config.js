import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    '@/',               // Duplicate alias directory at repo root
    'NewDashboard.tsx', // Scratch file
    'fix-notes-section.tsx', // Scratch file
    'backend/',         // Backend has its own lint config
    'android/',         // Capacitor build outputs
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Allow non-component exports alongside components (shadcn/ui pattern)
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Prefix unused vars with _ to suppress
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      }],
    },
  },
])
